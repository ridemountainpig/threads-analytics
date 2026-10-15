import "server-only";

import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import {
  computeBestTimeToPost,
  computeTopHours,
  DEFAULT_TZ,
  getBaselineMedianViews,
  getDateString,
} from "@/lib/analytics";
import { createLimiter } from "@/lib/concurrency";
import { DASHBOARD_POST_LIMIT } from "@/lib/dashboard-data";
import { dateKeyToUtcDate, FOLLOWER_LOOKBACK_DAYS, shiftDateKey } from "@/lib/followers";
import { getRecentPostPace, type PostPace } from "@/lib/post-growth-data";
import {
  getConversation,
  getFollowersCount,
  MissingReplyPermissionError,
  TokenExpiredError,
} from "@/lib/threads-api";
import { parseDateOnlyInTimeZone } from "@/lib/time-range";
import { buildReplyInbox, type PostConversation, type ReplyInbox } from "@/lib/today-replies";

export const TODAY_LIVE_TAG = "today-live";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export interface TodayBounds {
  todayStart: Date;
  yesterdayStart: Date;
}

// Not Threads' account insights: those cut days on Pacific time.
export function getTodayBounds(timeZone: string, now = new Date()): TodayBounds {
  const todayKey = getDateString(now, timeZone);
  const dayStart = (offset: number) =>
    parseDateOnlyInTimeZone(shiftDateKey(todayKey, offset), timeZone, false);
  return { todayStart: dayStart(0), yesterdayStart: dayStart(-1) };
}

const FOLLOWERS_TTL_SECONDS = 5 * 60;

function getFollowersCountCached(accountId: string, accessToken: string) {
  return unstable_cache(
    () => getFollowersCount(accountId, accessToken),
    ["today-followers", accountId],
    { revalidate: FOLLOWERS_TTL_SECONDS, tags: [TODAY_LIVE_TAG] },
  )();
}

export async function getTodayFollowers(
  accountId: string,
  accessToken: string,
  now = new Date(),
): Promise<{ current: number | null; net: number | null }> {
  // Snapshot days follow DEFAULT_TZ, the zone the sync writes them in.
  const todayKey = getDateString(now, DEFAULT_TZ);
  const [live, snapshots] = await Promise.all([
    getFollowersCountCached(accountId, accessToken).catch(() => null),
    db.followerSnapshot.findMany({
      where: {
        accountId,
        date: { gte: dateKeyToUtcDate(shiftDateKey(todayKey, -FOLLOWER_LOOKBACK_DAYS)) },
      },
      select: { date: true, followersCount: true },
      orderBy: { date: "asc" },
    }),
  ]);
  const todayDate = dateKeyToUtcDate(todayKey).getTime();
  const opening = snapshots.filter((s) => s.date.getTime() < todayDate).at(-1);
  const current = live ?? snapshots.find((s) => s.date.getTime() === todayDate)?.followersCount;
  return {
    current: current ?? null,
    net: current != null && opening ? current - opening.followersCount : null,
  };
}

export interface ThreadPartSummary {
  id: string;
  position: number;
  text: string;
  permalink: string;
  views: number;
  likes: number;
  replies: number;
}

export interface TodayPost {
  id: string;
  text: string;
  permalink: string;
  mediaType: string;
  postedAt: string;
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  shares: number;
  parts: ThreadPartSummary[];
  pace: PostPace | null;
  // Yesterday's posts only; null without a reading on both sides of midnight.
  gainedToday: { views: number; likes: number; replies: number } | null;
}

const RECENT_POST_LIMIT = 100;
const MEDIAN_LOOKBACK_MS = 90 * DAY_MS;
// An older baseline would fold several days into today.
const GAIN_BASELINE_MS = 30 * HOUR_MS;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

export async function getRecentPosts(
  accountId: string,
  { todayStart, yesterdayStart }: TodayBounds,
): Promise<{
  today: TodayPost[];
  yesterday: TodayPost[];
  typicalSample: number;
  medianViews: number;
  medianEngagementRate: number | null;
}> {
  const recent = {
    accountId,
    timestamp: { gte: yesterdayStart },
    mediaType: { not: "REPOST_FACADE" },
  };
  const [rows, settled, snapshots] = await Promise.all([
    db.post.findMany({
      where: recent,
      orderBy: { timestamp: "desc" },
      take: RECENT_POST_LIMIT,
      select: {
        id: true,
        text: true,
        permalink: true,
        mediaType: true,
        timestamp: true,
        views: true,
        likes: true,
        replies: true,
        reposts: true,
        quotes: true,
        shares: true,
        threadReplies: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            position: true,
            text: true,
            permalink: true,
            views: true,
            likes: true,
            replies: true,
          },
        },
      },
    }),
    db.post.findMany({
      where: {
        accountId,
        mediaType: { not: "REPOST_FACADE" },
        timestamp: { gte: new Date(todayStart.getTime() - MEDIAN_LOOKBACK_MS), lt: yesterdayStart },
      },
      take: DASHBOARD_POST_LIMIT,
      select: { views: true, likes: true, replies: true, reposts: true, quotes: true },
    }),
    db.postMetricSnapshot.findMany({
      where: {
        post: { ...recent, timestamp: { gte: yesterdayStart, lt: todayStart } },
        capturedAt: { gte: new Date(todayStart.getTime() - GAIN_BASELINE_MS) },
      },
      select: { postId: true, capturedAt: true, views: true, likes: true, replies: true },
      orderBy: { capturedAt: "asc" },
    }),
  ]);
  const { pace, typicalSample } = await getRecentPostPace(
    accountId,
    rows.map((row) => row.id),
  );

  type Reading = { views: number; likes: number; replies: number };
  const before = new Map<string, Reading>();
  const latest = new Map<string, Reading>();
  for (const { postId, capturedAt, ...reading } of snapshots) {
    (capturedAt < todayStart ? before : latest).set(postId, reading);
  }
  const gainOf = (id: string) => {
    const start = before.get(id);
    const end = latest.get(id);
    if (!start || !end) return null;
    return {
      views: Math.max(0, end.views - start.views),
      likes: Math.max(0, end.likes - start.likes),
      replies: Math.max(0, end.replies - start.replies),
    };
  };

  const today: TodayPost[] = [];
  const yesterday: TodayPost[] = [];
  for (const { timestamp, threadReplies, ...row } of rows) {
    const isToday = timestamp >= todayStart;
    (isToday ? today : yesterday).push({
      ...row,
      postedAt: timestamp.toISOString(),
      parts: threadReplies,
      pace: pace.get(row.id) ?? null,
      gainedToday: isToday ? null : gainOf(row.id),
    });
  }

  return {
    today,
    yesterday,
    typicalSample,
    medianViews: getBaselineMedianViews(settled),
    medianEngagementRate: median(
      settled
        .filter((post) => post.views > 0)
        .map(
          (post) => ((post.likes + post.replies + post.reposts + post.quotes) / post.views) * 100,
        ),
    ),
  };
}

const BEST_HOURS_LOOKBACK_MS = 90 * DAY_MS;

export async function getBestPostingHours(
  accountId: string,
  timeZone: string,
  now = new Date(),
): Promise<number[]> {
  const posts = await db.post.findMany({
    where: {
      accountId,
      mediaType: { not: "REPOST_FACADE" },
      timestamp: { gte: new Date(now.getTime() - BEST_HOURS_LOOKBACK_MS) },
    },
    orderBy: { timestamp: "desc" },
    take: DASHBOARD_POST_LIMIT,
    select: {
      id: true,
      text: true,
      timestamp: true,
      mediaType: true,
      permalink: true,
      views: true,
      likes: true,
      replies: true,
      reposts: true,
      quotes: true,
      shares: true,
    },
  });
  return computeTopHours(computeBestTimeToPost(posts, timeZone));
}

export type TodayInbox =
  | { status: "ok"; inbox: ReplyInbox; failedPosts: number }
  | { status: "missing_permission" | "token_expired" | "failed" };

// Replies are never stored; the cache only spares repeat requests.
const INBOX_TTL_SECONDS = 60;
const INBOX_CONCURRENCY = 4;
const INBOX_POST_LIMIT = 20;

function getConversationCached(accountId: string, postId: string, accessToken: string) {
  // Captured, not an argument, so the token stays out of the cache key.
  return unstable_cache(
    () => getConversation(postId, accessToken),
    [TODAY_LIVE_TAG, accountId, postId],
    { revalidate: INBOX_TTL_SECONDS, tags: [TODAY_LIVE_TAG] },
  )();
}

export async function getTodayInbox(
  accountId: string,
  accessToken: string,
  postIds: readonly string[],
  since: Date,
): Promise<TodayInbox> {
  const limit = createLimiter(INBOX_CONCURRENCY);
  const ids = postIds.slice(0, INBOX_POST_LIMIT);
  const results = await Promise.allSettled(
    ids.map((postId) => limit(() => getConversationCached(accountId, postId, accessToken))),
  );

  const conversations: PostConversation[] = [];
  let failedPosts = 0;
  for (const [i, result] of results.entries()) {
    if (result.status === "fulfilled") {
      conversations.push({ postId: ids[i]!, replies: result.value.replies });
      continue;
    }
    if (result.reason instanceof MissingReplyPermissionError) {
      return { status: "missing_permission" };
    }
    if (result.reason instanceof TokenExpiredError) return { status: "token_expired" };
    console.warn(
      `[today] conversation failed for ${ids[i]}:`,
      result.reason instanceof Error ? result.reason.message : result.reason,
    );
    failedPosts++;
  }

  if (conversations.length === 0 && failedPosts > 0) return { status: "failed" };
  return { status: "ok", inbox: buildReplyInbox(conversations, since), failedPosts };
}
