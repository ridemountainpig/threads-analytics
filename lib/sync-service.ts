import "server-only";

import { db } from "@/lib/db";
import { decryptToken } from "@/lib/crypto";
import { getPosts, getPostInsights, TokenExpiredError } from "@/lib/threads-api";

const INSIGHTS_REFRESH_DAYS = 30;

export interface SyncResult {
  postsCount?: number;
  insightsFailed?: number;
  error?: string;
}

interface SyncAccount {
  id: string;
  accessToken: string;
  expiresAt: Date;
}

export async function syncActiveAccount(preloaded?: SyncAccount): Promise<SyncResult> {
  const account = preloaded ?? (await db.threadsAccount.findFirst({ where: { isActive: true } }));

  if (!account) return { error: "No active account. Please add a Threads account first." };
  if (account.expiresAt < new Date()) return { error: "token_expired" };

  let accessToken: string;
  try {
    accessToken = decryptToken(account.accessToken);
  } catch {
    return { error: "Account credentials are unavailable. Please reconnect this account." };
  }
  const userId = account.id;

  try {
    const allPosts: Awaited<ReturnType<typeof getPosts>>["posts"] = [];
    let cursor: string | undefined;

    do {
      const page = await getPosts(userId, accessToken, cursor);
      allPosts.push(...page.posts);
      cursor = page.nextCursor;
    } while (cursor);

    // Posts older than this cutoff already have stable metrics — skip re-fetching insights
    const insightsCutoff = new Date(Date.now() - INSIGHTS_REFRESH_DAYS * 24 * 60 * 60 * 1000);
    const stalePostIds = new Set(
      (
        await db.post.findMany({
          where: { accountId: userId, timestamp: { lt: insightsCutoff } },
          select: { id: true },
        })
      ).map((p) => p.id),
    );

    const BATCH_SIZE = 5;
    let synced = 0;
    let insightsFailed = 0;

    for (let i = 0; i < allPosts.length; i += BATCH_SIZE) {
      const batch = allPosts.slice(i, i + BATCH_SIZE);
      const withInsights = await Promise.all(
        batch.map(async (post) => {
          if (stalePostIds.has(post.id)) return { post, insights: null };
          try {
            const insights = await getPostInsights(post.id, accessToken);
            if (insights === null) insightsFailed++;
            return { post, insights };
          } catch (err) {
            // Let token expiry abort the whole sync (reported as token_expired
            // by the outer catch) instead of silently failing every post.
            if (err instanceof TokenExpiredError) throw err;
            insightsFailed++;
            return { post, insights: null };
          }
        }),
      );

      const syncedAt = new Date();
      await db.$transaction(
        withInsights.map(({ post, insights }) =>
          db.post.upsert({
            where: { id: post.id },
            create: {
              id: post.id,
              accountId: userId,
              text: post.text,
              timestamp: new Date(post.timestamp),
              mediaType: post.media_type,
              permalink: post.permalink,
              ...(insights ?? {}),
            },
            update: {
              text: post.text,
              mediaType: post.media_type,
              permalink: post.permalink,
              ...(insights ?? {}),
              syncedAt,
            },
          }),
        ),
      );
      synced += withInsights.length;
    }

    await db.syncState.upsert({
      where: { accountId: userId },
      create: { accountId: userId, lastSyncedAt: new Date() },
      update: { lastSyncedAt: new Date() },
    });

    return { postsCount: synced, ...(insightsFailed > 0 ? { insightsFailed } : {}) };
  } catch (err) {
    if (err instanceof TokenExpiredError) return { error: "token_expired" };

    const message = err instanceof Error ? err.message : "Sync failed";
    return { error: message };
  }
}
