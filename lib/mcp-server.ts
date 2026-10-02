import "server-only";

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { db } from "./db";
import { Prisma } from "./generated/prisma";
import { decryptToken } from "./crypto";
import { TokenExpiredError } from "./threads-api";
import { getAccountViewTotals, getUserInsightsCached } from "./user-insights-cache";
import {
  computeFollowerRangeTrend,
  computeFollowerTrend,
  dateKeyToUtcDate,
  followerChangeBetween,
  followerQueryStart,
  parseDemographics,
  snapshotDays,
  summarizeFollowerGrowth,
  utcDateToKey,
} from "./followers";
import { isValidTimeZone, parseDateOnlyInTimeZone } from "./time-range";
import {
  computeActionFunnel,
  computeBestTimeToPost,
  computeContentFormatLengthMatrix,
  computeContentTypeAnalysis,
  computeContentTypeTimeSlot,
  computeDailyPerformance,
  computeDayHourHeatmap,
  computeDayOfWeekPerformance,
  computeEngagementBreakdownByDay,
  computeEngagementBreakdownPie,
  computeEngagementRateTrend,
  computeKeywordAnalysis,
  computeOptimalFrequency,
  computePostLengthAnalysis,
  computePostQualityScatter,
  computePostingCalendar,
  computePostingConsistency,
  computePostingGapAnalysis,
  computePostingStreak,
  computeReplyRateLeaders,
  computeShareLeaders,
  computeSharesTrend,
  computeTextFeatureComparison,
  computeTopHours,
  computeTopPostsByEngagementRate,
  computeViewsDistribution,
  computeViewsTrend,
  computeViralPosts,
  computeWeeklyFrequency,
  DEFAULT_TZ,
  getBaselineMedianViews,
  percentChange,
  ratePct,
  type PostWithInsights,
} from "./analytics";
import { buildMonthlyReview, MONTH_PATTERN, REVIEW_METRICS } from "./monthly-review";

const DEFAULT_RANGE_MS = 90 * 24 * 60 * 60 * 1000;
const TEXT_PREVIEW_LENGTH = 300;

const ANALYTICS_SECTIONS = [
  "total_engagement",
  "user_views",
  "daily_performance",
  "best_time_to_post",
  "top_hours",
  "content_type_analysis",
  "day_hour_heatmap",
  "post_length_analysis",
  "weekly_frequency",
  "post_quality_scatter",
  "content_format_length_matrix",
  "action_funnel",
  "viral_posts",
  "engagement_rate_trend",
  "reply_rate_leaders",
  "shares_trend",
  "posting_consistency",
  "keyword_analysis",
  "text_feature_comparison",
  "day_of_week_performance",
  "views_trend",
  "views_distribution",
  "optimal_frequency",
  "content_type_time_slot",
  "posting_gap_analysis",
  "posting_streak",
  "posting_calendar",
  "top_posts_by_engagement_rate",
  "share_leaders",
  "engagement_breakdown",
  "engagement_breakdown_by_day",
] as const;

const DEFAULT_SECTIONS: SectionName[] = [
  "total_engagement",
  "daily_performance",
  "best_time_to_post",
  "content_type_analysis",
  "viral_posts",
  "posting_consistency",
];

type SectionName = (typeof ANALYTICS_SECTIONS)[number];

const dateArg = (description: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/, "Use YYYY-MM-DD or an ISO datetime")
    .optional()
    .describe(`${description}. YYYY-MM-DD covers that whole local day; a datetime is read as UTC.`);

// A bare YYYY-MM-DD is a whole day in `tz`. Datetimes without a zone would
// otherwise be parsed in the server's local zone, so they are pinned to UTC.
function parseDate(value: string, endOfDay: boolean, tz: string): Date {
  if (!value.includes("T")) {
    // Date.UTC would roll a month like 13 into next year instead of rejecting it.
    if (Number.isNaN(new Date(value).getTime())) return new Date(NaN);
    return parseDateOnlyInTimeZone(value, tz, endOfDay);
  }
  return new Date(value.endsWith("Z") ? value : `${value}Z`);
}

function parseRange(since: string | undefined, until: string | undefined, tz: string) {
  const untilDate = until ? parseDate(until, true, tz) : new Date();
  const sinceDate = since
    ? parseDate(since, false, tz)
    : new Date(untilDate.getTime() - DEFAULT_RANGE_MS);
  if (Number.isNaN(untilDate.getTime()) || Number.isNaN(sinceDate.getTime())) {
    throw new Error("Invalid date parameters");
  }
  if (sinceDate > untilDate) {
    throw new Error("'since' must be on or before 'until'");
  }
  return { since: sinceDate, until: untilDate };
}

const READ_ONLY = { readOnlyHint: true };

type ConnectedAccount = Prisma.ThreadsAccountGetPayload<{ include: { syncState: true } }>;

async function listAccounts(): Promise<ConnectedAccount[]> {
  return db.threadsAccount.findMany({
    include: { syncState: true },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });
}

const accountArg = z
  .string()
  .optional()
  .describe(
    "Which connected account to query: a username (with or without @) or account id from get_account_overview. Optional when only one account is connected, required otherwise.",
  );

// With several accounts connected there is no safe default — the dashboard's
// "active" account is a UI preference the agent's user may not share — so the
// agent is told to ask instead of silently answering about the wrong profile.
async function resolveAccount(
  ref: string | undefined,
): Promise<{ account: ConnectedAccount } | { error: string }> {
  const accounts = await listAccounts();
  if (accounts.length === 0) return { error: "No Threads account is connected." };

  const handles = accounts.map((a) => `@${a.username}`).join(", ");
  if (ref) {
    const wanted = ref.trim().replace(/^@/, "").toLowerCase();
    const match = accounts.find((a) => a.id === wanted || a.username.toLowerCase() === wanted);
    if (!match) {
      return { error: `No connected account matches "${ref}". Connected accounts: ${handles}.` };
    }
    return { account: match };
  }

  if (accounts.length === 1) return { account: accounts[0] };
  return {
    error: `Multiple Threads accounts are connected (${handles}) and no 'account' was given. Ask the user which account they mean, then pass it as 'account'.`,
  };
}

// Engagement excludes shares, matching the app-wide rate (see getMetricRates).
function engagementRate(post: {
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
}) {
  return ratePct(post.likes + post.replies + post.reposts + post.quotes, post.views);
}

async function fetchPosts(accountId: string, since: Date, until: Date) {
  const posts = await db.post.findMany({
    where: {
      accountId,
      timestamp: { gte: since, lte: until },
      mediaType: { not: "REPOST_FACADE" },
    },
    orderBy: { timestamp: "desc" },
  });
  return posts.map((p): PostWithInsights => ({
    id: p.id,
    text: p.text,
    timestamp: p.timestamp,
    mediaType: p.mediaType,
    permalink: p.permalink,
    views: p.views,
    likes: p.likes,
    replies: p.replies,
    reposts: p.reposts,
    quotes: p.quotes,
    shares: p.shares,
  }));
}

async function computePeriodStats(accountId: string, range: { since: Date; until: Date }) {
  const { firstKey, lastKey } = snapshotDays(range);
  const [posts, snapshots] = await Promise.all([
    fetchPosts(accountId, range.since, range.until),
    db.followerSnapshot.findMany({
      where: {
        accountId,
        date: {
          gte: followerQueryStart(firstKey),
          lte: dateKeyToUtcDate(lastKey),
        },
      },
      orderBy: { date: "asc" },
      select: { date: true, followersCount: true },
    }),
  ]);
  const sum = (pick: (p: PostWithInsights) => number) => posts.reduce((s, p) => s + pick(p), 0);
  const views = sum((p) => p.views);
  const engagement = sum((p) => p.likes + p.replies + p.reposts + p.quotes);
  return {
    postCount: posts.length,
    views,
    avgViewsPerPost: posts.length > 0 ? Math.round(views / posts.length) : 0,
    medianViews: getBaselineMedianViews(posts),
    likes: sum((p) => p.likes),
    replies: sum((p) => p.replies),
    reposts: sum((p) => p.reposts),
    quotes: sum((p) => p.quotes),
    shares: sum((p) => p.shares),
    engagementRatePct: ratePct(engagement, views),
    followerChange: followerChangeBetween(
      snapshots.map((s) => ({ date: utcDateToKey(s.date), followers: s.followersCount })),
      firstKey,
      lastKey,
    ).net,
  };
}

type PeriodStats = Awaited<ReturnType<typeof computePeriodStats>> & {
  accountViews: number | null;
};

function diffPeriodStats(primary: PeriodStats, comparison: PeriodStats) {
  const change: Record<string, { change: number; changePct: number | null }> = {};
  for (const key of Object.keys(primary) as Array<keyof PeriodStats>) {
    const a = primary[key];
    const b = comparison[key];
    if (typeof a !== "number" || typeof b !== "number") continue;
    change[key] = {
      change: Math.round((a - b) * 100) / 100,
      changePct: percentChange(a, b, 2),
    };
  }
  return change;
}

function jsonResult(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload) }] };
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

export function registerMcpServer(server: McpServer) {
  server.registerTool(
    "get_account_overview",
    {
      title: "Get account overview",
      annotations: READ_ONLY,
      description:
        "Overview of every connected Threads account: username, sync status, post counts, data date range, and follower growth summary. Call this first to learn what data is available and, when more than one account is connected, which one the user wants.",
      inputSchema: z.object({}),
    },
    async () => {
      const accounts = await listAccounts();
      if (accounts.length === 0) return errorResult("No Threads account is connected.");

      const overviews = await Promise.all(
        accounts.map(async (account) => {
          const [postCount, oldest, newest, snapshots] = await Promise.all([
            db.post.count({
              where: { accountId: account.id, mediaType: { not: "REPOST_FACADE" } },
            }),
            db.post.findFirst({
              where: { accountId: account.id },
              orderBy: { timestamp: "asc" },
              select: { timestamp: true },
            }),
            db.post.findFirst({
              where: { accountId: account.id },
              orderBy: { timestamp: "desc" },
              select: { timestamp: true },
            }),
            db.followerSnapshot.findMany({
              where: { accountId: account.id },
              orderBy: { date: "asc" },
              select: { date: true, followersCount: true },
            }),
          ]);

          const trend = computeFollowerTrend(
            snapshots.map((s) => ({ date: s.date, followersCount: s.followersCount })),
          );
          return {
            id: account.id,
            username: account.username,
            isActiveInDashboard: account.isActive,
            lastSyncedAt: account.syncState?.lastSyncedAt?.toISOString() ?? null,
            accessTokenExpiresAt: account.expiresAt.toISOString(),
            postCount,
            dataRange: {
              oldestPost: oldest?.timestamp.toISOString() ?? null,
              newestPost: newest?.timestamp.toISOString() ?? null,
            },
            followers: summarizeFollowerGrowth(trend),
          };
        }),
      );

      return jsonResult({
        accountCount: overviews.length,
        ...(overviews.length > 1 && {
          note: "Multiple accounts are connected. Every other tool requires an 'account' argument (username or id). If the user hasn't said which account they mean, ask before calling them.",
        }),
        accounts: overviews,
      });
    },
  );

  server.registerTool(
    "list_posts",
    {
      title: "List posts",
      annotations: READ_ONLY,
      description:
        "List posts with their metrics (views, likes, replies, reposts, quotes, shares, engagement rate). Text is truncated to 300 characters; use get_post for the full text. Defaults to the last 90 days sorted by date. Sorting by engagement_rate covers at most the 2000 most recent posts in range (the response includes sortedOver when truncated).",
      inputSchema: z.object({
        account: accountArg,
        since: dateArg("Start of the date range (inclusive)"),
        until: dateArg("End of the date range (inclusive)"),
        sort: z
          .enum(["date", "views", "likes", "engagement_rate"])
          .optional()
          .describe("Sort order, descending (default: date)"),
        media_type: z
          .string()
          .optional()
          .describe("Filter by media type, e.g. TEXT_POST, IMAGE, VIDEO, CAROUSEL_ALBUM"),
        query: z.string().optional().describe("Case-insensitive substring match on post text"),
        limit: z.number().int().min(1).max(200).optional().describe("Max rows (default 50)"),
        offset: z.number().int().min(0).optional().describe("Rows to skip, for pagination"),
        timezone: z
          .string()
          .optional()
          .describe(
            "IANA timezone that YYYY-MM-DD dates are read in (default: the server's configured analytics timezone)",
          ),
      }),
    },
    async ({
      account: accountRef,
      since,
      until,
      sort,
      media_type,
      query,
      limit,
      offset,
      timezone,
    }) => {
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);
      const { account } = resolved;

      const tz = timezone ?? DEFAULT_TZ;
      if (!isValidTimeZone(tz)) return errorResult(`Unknown timezone: ${tz}`);

      let range;
      try {
        range = parseRange(since, until, tz);
      } catch (err) {
        return errorResult((err as Error).message);
      }

      const take = limit ?? 50;
      const skip = offset ?? 0;
      const where = {
        accountId: account.id,
        timestamp: { gte: range.since, lte: range.until },
        // Repost facades are never real posts, even when filtering by type.
        mediaType:
          media_type && media_type !== "REPOST_FACADE" ? media_type : { not: "REPOST_FACADE" },
        ...(query ? { text: { contains: query, mode: "insensitive" as const } } : {}),
      };

      const total = await db.post.count({ where });
      let rows;
      let sortedOver: number | undefined;
      if (sort === "engagement_rate") {
        const all = await db.post.findMany({ where, orderBy: { timestamp: "desc" }, take: 2000 });
        if (total > all.length) sortedOver = all.length;
        rows = all
          .sort((a, b) => (engagementRate(b) ?? -1) - (engagementRate(a) ?? -1))
          .slice(skip, skip + take);
      } else {
        const orderBy =
          sort === "views"
            ? { views: "desc" as const }
            : sort === "likes"
              ? { likes: "desc" as const }
              : { timestamp: "desc" as const };
        rows = await db.post.findMany({ where, orderBy, take, skip });
      }

      return jsonResult({
        total,
        offset: skip,
        returned: rows.length,
        ...(sortedOver !== undefined && { sortedOver }),
        posts: rows.map((p) => ({
          id: p.id,
          timestamp: p.timestamp.toISOString(),
          mediaType: p.mediaType,
          permalink: p.permalink,
          text:
            p.text.length > TEXT_PREVIEW_LENGTH
              ? `${p.text.slice(0, TEXT_PREVIEW_LENGTH)}…`
              : p.text,
          textLength: p.text.length,
          views: p.views,
          likes: p.likes,
          replies: p.replies,
          reposts: p.reposts,
          quotes: p.quotes,
          shares: p.shares,
          engagementRatePct: engagementRate(p),
        })),
      });
    },
  );

  server.registerTool(
    "get_post",
    {
      title: "Get post",
      annotations: READ_ONLY,
      description: "Full detail of a single post by id, including its complete text.",
      inputSchema: z.object({
        account: accountArg,
        id: z.string().describe("Post id from list_posts"),
      }),
    },
    async ({ account: accountRef, id }) => {
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);
      const { account } = resolved;
      const post = await db.post.findFirst({ where: { id, accountId: account.id } });
      if (!post) return errorResult(`Post ${id} not found.`);
      return jsonResult({
        id: post.id,
        timestamp: post.timestamp.toISOString(),
        mediaType: post.mediaType,
        permalink: post.permalink,
        text: post.text,
        views: post.views,
        likes: post.likes,
        replies: post.replies,
        reposts: post.reposts,
        quotes: post.quotes,
        shares: post.shares,
        engagementRatePct: engagementRate(post),
        syncedAt: post.syncedAt.toISOString(),
      });
    },
  );

  server.registerTool(
    "get_analytics",
    {
      title: "Get analytics",
      annotations: READ_ONLY,
      description:
        "Aggregated analytics over a date range. Pick only the sections you need to keep the response small. Sections: " +
        ANALYTICS_SECTIONS.join(", ") +
        ". Defaults to a summary set over the last 90 days.",
      inputSchema: z.object({
        account: accountArg,
        since: dateArg("Start of the date range (inclusive)"),
        until: dateArg("End of the date range (inclusive)"),
        sections: z
          .array(z.enum(ANALYTICS_SECTIONS))
          .optional()
          .describe("Which analytics sections to compute"),
        timezone: z
          .string()
          .optional()
          .describe(
            "IANA timezone for YYYY-MM-DD dates and day/hour bucketing, e.g. 'America/Los_Angeles' (default: the server's configured analytics timezone)",
          ),
      }),
    },
    async ({ account: accountRef, since, until, sections, timezone }) => {
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);
      const { account } = resolved;

      const tz = timezone ?? DEFAULT_TZ;
      if (!isValidTimeZone(tz)) return errorResult(`Unknown timezone: ${tz}`);

      let range;
      try {
        range = parseRange(since, until, tz);
      } catch (err) {
        return errorResult((err as Error).message);
      }

      const wanted = new Set<SectionName>(sections?.length ? sections : DEFAULT_SECTIONS);
      const posts = await fetchPosts(account.id, range.since, range.until);

      const needsUserInsights = [
        "total_engagement",
        "user_views",
        "daily_performance",
        "engagement_rate_trend",
      ].some((s) => wanted.has(s as SectionName));
      let userInsights = {
        views: [] as Array<{ end_time: string; value: number }>,
        totalLikes: 0,
        totalReplies: 0,
        totalReposts: 0,
        totalQuotes: 0,
      };
      let insightsUnavailable = false;
      if (needsUserInsights) {
        try {
          userInsights = await getUserInsightsCached(
            account.id,
            decryptToken(account.accessToken),
            Math.floor(range.since.getTime() / 1000),
            Math.floor(range.until.getTime() / 1000),
          );
        } catch (err) {
          if (err instanceof TokenExpiredError) {
            return errorResult(
              "The Threads access token has expired. Account-level view data is unavailable until it is reconnected in Settings.",
            );
          }
          console.error("[mcp] getUserInsights failed:", err);
          insightsUnavailable = true;
        }
      }

      const result: Record<string, unknown> = {
        range: { since: range.since.toISOString(), until: range.until.toISOString() },
        timezone: tz,
        postCount: posts.length,
      };
      if (insightsUnavailable) {
        result.warning =
          "Account-level Threads insights could not be fetched right now: total_engagement and user_views are omitted, and daily_performance/engagement_rate_trend fall back to per-post views.";
      }
      const bestTime = () => computeBestTimeToPost(posts, tz);
      const builders: Record<SectionName, () => unknown> = {
        total_engagement: () => ({
          likes: userInsights.totalLikes,
          replies: userInsights.totalReplies,
          reposts: userInsights.totalReposts,
          quotes: userInsights.totalQuotes,
          shares: posts.reduce((sum, p) => sum + p.shares, 0),
        }),
        user_views: () => userInsights.views,
        daily_performance: () => computeDailyPerformance(posts, userInsights.views, tz),
        best_time_to_post: bestTime,
        top_hours: () => computeTopHours(bestTime()),
        content_type_analysis: () => computeContentTypeAnalysis(posts),
        day_hour_heatmap: () => computeDayHourHeatmap(posts, tz),
        post_length_analysis: () => computePostLengthAnalysis(posts),
        weekly_frequency: () => computeWeeklyFrequency(posts, tz),
        post_quality_scatter: () => computePostQualityScatter(posts),
        content_format_length_matrix: () => computeContentFormatLengthMatrix(posts),
        action_funnel: () => computeActionFunnel(posts),
        viral_posts: () => computeViralPosts(posts),
        engagement_rate_trend: () => computeEngagementRateTrend(posts, userInsights.views, tz),
        reply_rate_leaders: () => computeReplyRateLeaders(posts),
        shares_trend: () => computeSharesTrend(posts, tz),
        posting_consistency: () => computePostingConsistency(posts, range.since, range.until, tz),
        keyword_analysis: () => computeKeywordAnalysis(posts),
        text_feature_comparison: () => computeTextFeatureComparison(posts),
        day_of_week_performance: () => computeDayOfWeekPerformance(posts, tz),
        views_trend: () => computeViewsTrend(posts, tz),
        views_distribution: () => computeViewsDistribution(posts),
        optimal_frequency: () => computeOptimalFrequency(posts, tz),
        content_type_time_slot: () => computeContentTypeTimeSlot(posts, tz),
        posting_gap_analysis: () => computePostingGapAnalysis(posts, tz),
        posting_streak: () => computePostingStreak(posts, tz),
        posting_calendar: () =>
          computePostingCalendar(posts, range.since, range.until, undefined, tz),
        top_posts_by_engagement_rate: () => computeTopPostsByEngagementRate(posts),
        share_leaders: () => computeShareLeaders(posts),
        engagement_breakdown: () => computeEngagementBreakdownPie(posts),
        engagement_breakdown_by_day: () => computeEngagementBreakdownByDay(posts, tz),
      };
      for (const section of ANALYTICS_SECTIONS) {
        if (!wanted.has(section)) continue;
        // These two are pure insights data; zeros would read as real metrics.
        if (insightsUnavailable && (section === "total_engagement" || section === "user_views")) {
          continue;
        }
        result[section] = builders[section]();
      }

      return jsonResult(result);
    },
  );

  server.registerTool(
    "get_follower_history",
    {
      title: "Get follower history",
      annotations: READ_ONLY,
      description:
        "Daily follower-count snapshots with growth summary, and optionally the latest audience demographics (country, city, age, gender). Snapshot days are calendar days in the server's configured analytics timezone.",
      inputSchema: z.object({
        account: accountArg,
        since: dateArg("Start of the date range (inclusive)"),
        until: dateArg("End of the date range (inclusive)"),
        include_demographics: z
          .boolean()
          .optional()
          .describe("Include the latest demographics breakdown (default false)"),
      }),
    },
    async ({ account: accountRef, since, until, include_demographics }) => {
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);
      const { account } = resolved;

      let range;
      try {
        range = parseRange(since, until, DEFAULT_TZ);
      } catch (err) {
        return errorResult((err as Error).message);
      }

      const { firstKey, lastKey } = snapshotDays(range);
      const snapshots = await db.followerSnapshot.findMany({
        where: {
          accountId: account.id,
          date: { gte: followerQueryStart(firstKey), lte: dateKeyToUtcDate(lastKey) },
        },
        orderBy: { date: "asc" },
        select: { date: true, followersCount: true },
      });
      const { trend, opening } = computeFollowerRangeTrend(snapshots, firstKey, lastKey);

      const latestWithDemographics = include_demographics
        ? await db.followerSnapshot.findFirst({
            where: { accountId: account.id, demographics: { not: Prisma.AnyNull } },
            orderBy: { date: "desc" },
          })
        : null;

      return jsonResult({
        summary: summarizeFollowerGrowth(trend, opening),
        trend,
        demographics: latestWithDemographics
          ? {
              asOf: latestWithDemographics.date.toISOString().slice(0, 10),
              ...parseDemographics(latestWithDemographics.demographics),
            }
          : undefined,
      });
    },
  );

  server.registerTool(
    "compare_periods",
    {
      title: "Compare periods",
      annotations: READ_ONLY,
      description:
        "Compare core metrics (posts, views, engagement, follower growth) between two periods, with absolute and percentage changes. Dates without a time are whole days in the analytics timezone. 'views' counts views on posts published in each period; 'accountViews' is every view the account received in it (Threads account insights), older posts included. Defaults: primary period = last 90 days, comparison period = the window of the same length immediately before it — to compare calendar months, pass both periods explicitly or use get_monthly_review.",
      inputSchema: z.object({
        account: accountArg,
        since: dateArg("Start of the primary period (inclusive)"),
        until: dateArg("End of the primary period (inclusive)"),
        compare_since: dateArg("Start of the comparison period (inclusive)"),
        compare_until: dateArg("End of the comparison period (inclusive)"),
        timezone: z
          .string()
          .optional()
          .describe(
            "IANA timezone that dates without a time are read in (default: the server's configured analytics timezone)",
          ),
      }),
    },
    async ({ account: accountRef, since, until, compare_since, compare_until, timezone }) => {
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);
      const { account } = resolved;

      const tz = timezone ?? DEFAULT_TZ;
      if (!isValidTimeZone(tz)) return errorResult(`Unknown timezone: ${tz}`);

      let primary;
      let comparison;
      try {
        primary = parseRange(since, until, tz);
        if (compare_since || compare_until) {
          if (!compare_since || !compare_until) {
            return errorResult("Provide both compare_since and compare_until, or neither.");
          }
          comparison = parseRange(compare_since, compare_until, tz);
        } else {
          const length = primary.until.getTime() - primary.since.getTime();
          const compareUntil = new Date(primary.since.getTime() - 1);
          comparison = { since: new Date(compareUntil.getTime() - length), until: compareUntil };
        }
      } catch (err) {
        return errorResult((err as Error).message);
      }

      const [accountViews, primaryCore, comparisonCore] = await Promise.all([
        getAccountViewTotals(account, [
          { label: "the primary period", ...primary },
          { label: "the comparison period", ...comparison },
        ]),
        computePeriodStats(account.id, primary),
        computePeriodStats(account.id, comparison),
      ]);
      const primaryStats = { ...primaryCore, accountViews: accountViews.totals[0] };
      const comparisonStats = { ...comparisonCore, accountViews: accountViews.totals[1] };

      return jsonResult({
        timezone: tz,
        ...(accountViews.warning && { warning: accountViews.warning }),
        primary: {
          range: { since: primary.since.toISOString(), until: primary.until.toISOString() },
          ...primaryStats,
        },
        comparison: {
          range: { since: comparison.since.toISOString(), until: comparison.until.toISOString() },
          ...comparisonStats,
        },
        change: diffPeriodStats(primaryStats, comparisonStats),
      });
    },
  );

  server.registerTool(
    "get_monthly_review",
    {
      title: "Get monthly review",
      annotations: READ_ONLY,
      description:
        "Everything needed to review one calendar month (bucketed in the analytics timezone): KPIs against a comparison month (the previous month by default, or any earlier month via compare_month, e.g. the same month last year) and a trailing baseline, top and bottom posts, follower gains with the posts around them, content mix, threads, weekly trajectory, and audience shift. Pass the experiments proposed in last month's review to have each one scored by comparing its metric in this month against the month before, whatever compare_month is. Post metrics are totals as of each post's last sync, so read dataQuality before drawing conclusions.",
      inputSchema: z.object({
        account: accountArg,
        month: z
          .string()
          .regex(MONTH_PATTERN, "Use YYYY-MM")
          .optional()
          .describe("Month to review as YYYY-MM (default: the last complete month)"),
        compare_month: z
          .string()
          .regex(MONTH_PATTERN, "Use YYYY-MM")
          .optional()
          .describe("Earlier month to compare against as YYYY-MM (default: the month before)"),
        timezone: z
          .string()
          .optional()
          .describe(
            "IANA timezone for month and day boundaries (default: the server's configured analytics timezone)",
          ),
        baseline_months: z
          .number()
          .int()
          .min(1)
          .max(6)
          .optional()
          .describe("How many months before 'month' form the baseline (default 3)"),
        experiments: z
          .array(
            z.object({
              metric: z.enum(REVIEW_METRICS),
              direction: z
                .enum(["up", "down"])
                .describe("Which way the experiment should move the metric"),
              target: z
                .number()
                .optional()
                .describe(
                  "Value the metric should reach; without it, a move of 5% or more in the right direction counts as a hit",
                ),
              label: z
                .string()
                .max(200)
                .optional()
                .describe("What the experiment was, e.g. 'two multi-part threads a week'"),
            }),
          )
          .max(10)
          .optional()
          .describe("Experiments from last month's review, to be scored against this month"),
      }),
    },
    async ({
      account: accountRef,
      month,
      compare_month,
      timezone,
      baseline_months,
      experiments,
    }) => {
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);

      const tz = timezone ?? DEFAULT_TZ;
      if (!isValidTimeZone(tz)) return errorResult(`Unknown timezone: ${tz}`);

      const result = await buildMonthlyReview({
        account: resolved.account,
        month,
        compareMonth: compare_month,
        timezone: tz,
        baselineMonths: baseline_months ?? 3,
        experiments,
      });
      if ("error" in result) return errorResult(result.error);
      return jsonResult(result.review);
    },
  );

  const promptText = (text: string) => ({
    messages: [{ role: "user" as const, content: { type: "text" as const, text } }],
  });
  const periodArg = z
    .string()
    .optional()
    .describe("Analysis period, e.g. '30d', '90d', or '2026-01-01 to 2026-03-01' (default 90d)");
  const promptAccountArg = z
    .string()
    .optional()
    .describe("Account username to analyze; only needed when several accounts are connected");
  const accountLine = (account: string | undefined) =>
    account
      ? `Analyze the account @${account.replace(/^@/, "")} — pass it as 'account' to every tool.\n\n`
      : "";

  server.registerPrompt(
    "performance-review",
    {
      title: "Performance review",
      description: "A full performance report for a period: trends, wins, and what to improve.",
      argsSchema: z.object({ period: periodArg, account: promptAccountArg }),
    },
    ({ period, account }) =>
      promptText(
        accountLine(account) +
          `Review my Threads performance for the period: ${period ?? "the last 90 days"}.\n\n` +
          `Use the threads-analytics MCP tools: start with get_account_overview, then get_analytics ` +
          `(sections: total_engagement, daily_performance, engagement_rate_trend, posting_consistency, viral_posts) ` +
          `and list_posts sorted by views to find my top and bottom posts.\n\n` +
          `Write a report covering: overall trend vs. the numbers, my 3 best and 3 worst posts with likely reasons, ` +
          `follower growth (get_follower_history), and 3 concrete actions to improve next period.`,
      ),
  );

  server.registerPrompt(
    "content-strategy",
    {
      title: "Content strategy review",
      description:
        "Analyze which content types, lengths, and topics work, and recommend a strategy.",
      argsSchema: z.object({ period: periodArg, account: promptAccountArg }),
    },
    ({ period, account }) =>
      promptText(
        accountLine(account) +
          `Analyze my Threads content strategy for: ${period ?? "the last 90 days"}.\n\n` +
          `Use get_analytics (sections: content_type_analysis, post_length_analysis, content_format_length_matrix, ` +
          `action_funnel, reply_rate_leaders) and read my actual top posts with list_posts + get_post to identify topics and hooks.\n\n` +
          `Tell me: which formats and lengths outperform, which topics drive engagement vs. views, ` +
          `what the engagement funnel says about my audience, and a recommended content mix going forward.`,
      ),
  );

  server.registerPrompt(
    "posting-schedule",
    {
      title: "Best posting schedule",
      description: "Recommend a weekly posting schedule based on when my audience engages.",
      argsSchema: z.object({ period: periodArg, account: promptAccountArg }),
    },
    ({ period, account }) =>
      promptText(
        accountLine(account) +
          `Work out my optimal Threads posting schedule from: ${period ?? "the last 90 days"}.\n\n` +
          `Use get_analytics (sections: best_time_to_post, top_hours, day_hour_heatmap, weekly_frequency, posting_consistency).\n\n` +
          `Recommend a concrete weekly schedule (days + times with confidence levels), how many posts per week, ` +
          `and note where the data is too thin to be confident.`,
      ),
  );

  server.registerPrompt(
    "viral-post-breakdown",
    {
      title: "Viral post breakdown",
      description: "Deep-dive the outlier posts and extract repeatable patterns.",
      argsSchema: z.object({ period: periodArg, account: promptAccountArg }),
    },
    ({ period, account }) =>
      promptText(
        accountLine(account) +
          `Break down my viral Threads posts from: ${period ?? "the last 90 days"}.\n\n` +
          `Use get_analytics (sections: viral_posts, post_quality_scatter), then fetch each outlier's full text with get_post.\n\n` +
          `For each viral post: what it was about, the hook, format, length, and timing. ` +
          `Then extract the repeatable patterns and suggest 3 new post ideas that apply them.`,
      ),
  );

  server.registerPrompt(
    "audience-insights",
    {
      title: "Audience insights",
      description:
        "Analyze follower growth and audience demographics, and what they imply for content and timing.",
      argsSchema: z.object({ period: periodArg, account: promptAccountArg }),
    },
    ({ period, account }) =>
      promptText(
        accountLine(account) +
          `Analyze my Threads audience for: ${period ?? "the last 90 days"}.\n\n` +
          `Use get_follower_history with include_demographics: true for the growth trend and demographics, ` +
          `plus get_analytics (sections: action_funnel, engagement_breakdown, best_time_to_post, daily_performance).\n\n` +
          `Tell me: how follower growth correlates with my posting activity, who my audience is ` +
          `(top countries, age groups, gender split), whether my posting times fit my audience's likely time zones, ` +
          `and what content or timing changes the data suggests.`,
      ),
  );

  server.registerPrompt(
    "topic-analysis",
    {
      title: "Topic analysis",
      description: "Find which topics and writing patterns drive performance.",
      argsSchema: z.object({ period: periodArg, account: promptAccountArg }),
    },
    ({ period, account }) =>
      promptText(
        accountLine(account) +
          `Analyze which topics and writing patterns work on my Threads for: ${period ?? "the last 90 days"}.\n\n` +
          `Use get_analytics (sections: keyword_analysis, text_feature_comparison, content_type_analysis, ` +
          `top_posts_by_engagement_rate), then read the strongest and weakest posts in full with list_posts + get_post ` +
          `to identify topics beyond single keywords.\n\n` +
          `Tell me: my top-performing topics and why, which writing patterns (questions, links, length, format) help or hurt, ` +
          `which topics to double down on or drop, and 5 post ideas that apply the winning patterns.`,
      ),
  );

  server.registerPrompt(
    "monthly-review",
    {
      title: "Monthly review",
      description:
        "Review one month against the previous month and a baseline, score last month's experiments, and set three new ones.",
      argsSchema: z.object({
        month: z
          .string()
          .optional()
          .describe("Month to review as YYYY-MM (default: the last complete month)"),
        compare_month: z
          .string()
          .optional()
          .describe("Earlier month to compare against as YYYY-MM (default: the month before)"),
        account: promptAccountArg,
        previous_experiments: z
          .string()
          .optional()
          .describe("The experiments JSON from last month's review, to score against this month"),
      }),
    },
    ({ month, compare_month, account, previous_experiments }) => {
      const toolArgs = [
        month && `month "${month}"`,
        compare_month && `compare_month "${compare_month}"`,
      ]
        .filter(Boolean)
        .join(" and ");
      return promptText(
        accountLine(account) +
          `Write my Threads monthly review for ${month ?? "the last complete month"}.\n\n` +
          (previous_experiments
            ? `Last month's experiments:\n${previous_experiments}\n\nPass them to get_monthly_review as 'experiments'.\n\n`
            : `If you can read local files, look for last month's review at threads-reviews/YYYY-MM.md and pass the experiments from its JSON block to get_monthly_review as 'experiments'.\n\n`) +
          `Call get_monthly_review${toolArgs ? ` with ${toolArgs}` : ""}, then read the top 3 and bottom 3 posts in full with get_post.\n\n` +
          `Structure the report:\n` +
          `1. TL;DR in three sentences.\n` +
          `2. A KPI table (this month vs. the comparison month vs. baseline average) for posts, account views, median views, hit rate, engagement / reply / share rate, follower net, and followers per 1k views.\n` +
          `3. What worked and what didn't, citing specific posts and why they landed or missed.\n` +
          `4. Where new followers came from, using followers.topGainDays and the posts around them.\n` +
          `5. Last month's experiments: each result with its numbers, and whether to keep, adjust, or drop it. Skip this section if there were none.\n` +
          `6. Three experiments for next month, each tied to the one metric it should move.\n\n` +
          `Call out anything in dataQuality.notes that limits the conclusions.\n\n` +
          `End with the new experiments as a JSON array of { metric, direction, target?, label }, where metric is one of: ${REVIEW_METRICS.join(", ")}. ` +
          `If you can write files, save the whole review to threads-reviews/<reviewed month>.md; otherwise tell me to keep that JSON and pass it as previous_experiments next month.`,
      );
    },
  );
}
