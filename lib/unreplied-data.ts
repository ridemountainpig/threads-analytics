import "server-only";

import { db } from "@/lib/db";
import { createLimiter } from "@/lib/concurrency";
import { cachedFresh } from "@/lib/fresh-cache";
import { getConversation, MissingReplyPermissionError, TokenExpiredError } from "@/lib/threads-api";
import { TODAY_LIVE_TAG } from "@/lib/today-data";
import {
  buildUnrepliedList,
  type PostConversation,
  type UnrepliedComment,
} from "@/lib/today-replies";

export const UNREPLIED_TAG = "unreplied-live";

export const UNREPLIED_RANGES = [7, 30, 90] as const;
export type UnrepliedRange = (typeof UNREPLIED_RANGES)[number];
export const DEFAULT_UNREPLIED_RANGE: UnrepliedRange = 30;

export function parseUnrepliedRange(value: string | undefined): UnrepliedRange {
  const days = Number(value);
  return (UNREPLIED_RANGES as readonly number[]).includes(days)
    ? (days as UnrepliedRange)
    : DEFAULT_UNREPLIED_RANGE;
}

// Replies are never stored; the cache only spares repeat requests. The key
// carries the post's synced reply count, so a post refetches as soon as a sync
// sees new replies, while a quiet post is read at most once per TTL.
const CONVERSATION_TTL_SECONDS = 10 * 60;
const CONCURRENCY = 4;
// Each post costs one or more API calls; past this many the oldest are skipped.
export const UNREPLIED_POST_LIMIT = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

function getConversationCached(
  accountId: string,
  postId: string,
  replyCount: number,
  accessToken: string,
) {
  // Captured, not an argument, so the token stays out of the cache key.
  return cachedFresh(
    () => getConversation(postId, accessToken),
    [UNREPLIED_TAG, accountId, postId, String(replyCount)],
    // A sync expires TODAY_LIVE_TAG, so it refreshes this list too.
    { ttlSeconds: CONVERSATION_TTL_SECONDS, tags: [UNREPLIED_TAG, TODAY_LIVE_TAG] },
  );
}

export type UnrepliedResult =
  | {
      status: "ok";
      comments: Array<UnrepliedComment & { postText: string; postPermalink: string }>;
      answered: number;
      /** Posts in range with at least one reply, all of them scanned unless skippedPosts > 0. */
      postsWithReplies: number;
      skippedPosts: number;
      failedPosts: number;
      truncatedPosts: number;
    }
  | { status: "missing_permission" | "token_expired" | "failed" };

export async function getUnrepliedComments(
  accountId: string,
  accessToken: string,
  days: UnrepliedRange,
  now = new Date(),
): Promise<UnrepliedResult> {
  const where = {
    accountId,
    mediaType: { not: "REPOST_FACADE" },
    timestamp: { gte: new Date(now.getTime() - days * DAY_MS) },
    // A post the last sync saw without replies has nothing to answer.
    replies: { gt: 0 },
  };
  const [posts, postsWithReplies] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: UNREPLIED_POST_LIMIT,
      select: { id: true, text: true, permalink: true, replies: true },
    }),
    db.post.count({ where }),
  ]);

  const limit = createLimiter(CONCURRENCY);
  const results = await Promise.allSettled(
    posts.map((post) =>
      limit(() => getConversationCached(accountId, post.id, post.replies, accessToken)),
    ),
  );

  const conversations: PostConversation[] = [];
  let failedPosts = 0;
  let truncatedPosts = 0;
  for (const [i, result] of results.entries()) {
    if (result.status === "fulfilled") {
      conversations.push({ postId: posts[i]!.id, replies: result.value.replies });
      if (result.value.truncated) truncatedPosts++;
      continue;
    }
    if (result.reason instanceof MissingReplyPermissionError) {
      return { status: "missing_permission" };
    }
    if (result.reason instanceof TokenExpiredError) return { status: "token_expired" };
    console.warn(
      `[unreplied] conversation failed for ${posts[i]!.id}:`,
      result.reason instanceof Error ? result.reason.message : result.reason,
    );
    failedPosts++;
  }

  if (conversations.length === 0 && failedPosts > 0) return { status: "failed" };

  const byId = new Map(posts.map((post) => [post.id, post]));
  const list = buildUnrepliedList(conversations);
  return {
    status: "ok",
    comments: list.comments.map((comment) => ({
      ...comment,
      postText: byId.get(comment.postId)?.text ?? "",
      postPermalink: byId.get(comment.postId)?.permalink ?? "",
    })),
    answered: list.answered,
    postsWithReplies,
    skippedPosts: Math.max(0, postsWithReplies - posts.length),
    failedPosts,
    truncatedPosts,
  };
}
