import "server-only";

import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma";
import { decryptToken } from "@/lib/crypto";
import {
  DEMOGRAPHICS_MIN_FOLLOWERS,
  getPosts,
  getPostInsights,
  getFollowerDemographics,
  getFollowersCount,
  TokenExpiredError,
} from "@/lib/threads-api";
import { ensureFreshToken } from "@/lib/token-refresh";
import { DEFAULT_TZ, getDateString } from "@/lib/analytics";
import { dateKeyToUtcDate } from "@/lib/followers";

const INSIGHTS_REFRESH_DAYS = 30;

/** Spacing between retries when a day's demographics fetch came back empty. */
const DEMOGRAPHICS_RETRY_INTERVAL_MS = 6 * 60 * 60 * 1000;

export interface SyncResult {
  postsCount?: number;
  insightsFailed?: number;
  error?: string;
}

export interface AccountSyncResult extends SyncResult {
  accountId: string;
  username: string;
}

interface SyncAccount {
  id: string;
  accessToken: string;
  expiresAt: Date;
  tokenRefreshedAt: Date | null;
  tokenCheckedAt: Date | null;
}

/**
 * Records the follower count (and demographics, when the profile qualifies) as
 * one row per calendar day. The API can't report either metric for a past date,
 * so a day missed here is lost for good.
 *
 * The count is re-read on every sync and overwrites the day's row, so once the
 * day is over the row holds its closing figure and the day-over-day delta is
 * the change that actually happened on that date. It is a single request, so
 * post syncing can be as frequent as the user likes.
 *
 * Demographics cost four requests, move by fractions of a point per day, and so
 * are fetched at most once per calendar day (plus a spaced retry when a fetch
 * came back empty). `capturedAt` marks the last demographics attempt, not the
 * last count reading.
 *
 * Syncs also run from cron, where the browser's time-zone cookie isn't
 * available, so days are bucketed by DEFAULT_TZ to keep the series consistent
 * no matter what triggered the sync.
 */
async function captureFollowerSnapshot(accountId: string, accessToken: string): Promise<void> {
  const date = dateKeyToUtcDate(getDateString(new Date(), DEFAULT_TZ));

  let existing: { followersCount: number; demographics: unknown; capturedAt: Date } | null = null;
  try {
    existing = await db.followerSnapshot.findUnique({
      where: { accountId_date: { accountId, date } },
      select: { followersCount: true, demographics: true, capturedAt: true },
    });
  } catch {
    // Treated as "not captured yet" — worst case demographics are fetched again.
  }

  const followersCount =
    (await getFollowersCount(accountId, accessToken)) ?? existing?.followersCount ?? null;
  if (followersCount === null) return;

  // A failed demographics fetch is worth retrying — losing the day entirely to
  // one bad response would be worse — but not on every sync, or an hourly post
  // schedule would spend four requests an hour retrying a broken call.
  const retryDue =
    existing !== null &&
    existing.demographics === null &&
    Date.now() - existing.capturedAt.getTime() >= DEMOGRAPHICS_RETRY_INTERVAL_MS;
  const fetchDemographics =
    followersCount >= DEMOGRAPHICS_MIN_FOLLOWERS && (existing === null || retryDue);
  const demographics = fetchDemographics
    ? await getFollowerDemographics(accountId, accessToken)
    : null;

  // Prisma types Json columns as InputJsonValue, which a named interface never
  // structurally satisfies; the shape is validated on read by parseDemographics.
  const demographicsJson = demographics as unknown as Prisma.InputJsonValue;

  try {
    await db.followerSnapshot.upsert({
      where: { accountId_date: { accountId, date } },
      create: {
        accountId,
        date,
        followersCount,
        ...(demographics ? { demographics: demographicsJson } : {}),
      },
      // Demographics are only written when this run actually fetched them, so a
      // failed fetch can't blank out a good earlier snapshot. capturedAt only
      // moves on an attempt, so count-only syncs don't keep pushing the retry.
      update: {
        followersCount,
        ...(fetchDemographics ? { capturedAt: new Date() } : {}),
        ...(demographics ? { demographics: demographicsJson } : {}),
      },
    });
  } catch (err) {
    console.warn(
      `[sync] follower snapshot failed for ${accountId}:`,
      err instanceof Error ? err.message : err,
    );
  }
}

export async function syncAccount(account: SyncAccount): Promise<SyncResult> {
  if (account.expiresAt < new Date()) return { error: "token_expired" };

  let accessToken: string;
  try {
    accessToken = decryptToken(account.accessToken);
  } catch {
    return { error: "Account credentials are unavailable. Please reconnect this account." };
  }
  const userId = account.id;

  try {
    // Every sync — manual or scheduled — passes through here, making it the one
    // place that can keep the token alive and its recorded expiry honest.
    accessToken = await ensureFreshToken(account, accessToken);

    const allPosts: Awaited<ReturnType<typeof getPosts>>["posts"] = [];
    let cursor: string | undefined;

    do {
      const page = await getPosts(userId, accessToken, cursor);
      allPosts.push(...page.posts);
      cursor = page.nextCursor;
    } while (cursor);

    // Skip re-fetching insights only for posts that are BOTH older than the
    // refresh cutoff (metrics have stabilized) AND already have at least one
    // non-zero metric — evidence that insights were fetched successfully at
    // least once. A post still stuck at all-zero keeps getting retried
    // regardless of age, so a transient insights failure on the first sync
    // can't freeze it at 0 forever.
    const insightsCutoff = new Date(Date.now() - INSIGHTS_REFRESH_DAYS * 24 * 60 * 60 * 1000);
    const stalePostIds = new Set(
      (
        await db.post.findMany({
          where: {
            accountId: userId,
            timestamp: { lt: insightsCutoff },
            OR: [
              { views: { gt: 0 } },
              { likes: { gt: 0 } },
              { replies: { gt: 0 } },
              { reposts: { gt: 0 } },
              { quotes: { gt: 0 } },
              { shares: { gt: 0 } },
            ],
          },
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

    await captureFollowerSnapshot(userId, accessToken);

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

// Every connected account is synced, not just the active one, so switching
// accounts never lands on stale data and each token keeps getting renewed.
// Sequential to stay within the Threads API rate limit; the active account
// goes first so the dashboard the user is looking at refreshes soonest.
export async function syncAllAccounts(): Promise<AccountSyncResult[]> {
  const accounts = await db.threadsAccount.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });

  const results: AccountSyncResult[] = [];
  for (const account of accounts) {
    const result = await syncAccount(account);
    if (result.error) console.warn(`[sync] ${account.username}: ${result.error}`);
    results.push({ accountId: account.id, username: account.username, ...result });
  }
  return results;
}
