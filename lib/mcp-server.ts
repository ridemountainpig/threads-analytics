import "server-only";

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { db } from "./db";
import { Prisma } from "./generated/prisma";
import { decryptToken } from "./crypto";
import { TokenExpiredError } from "./threads-api";
import { getUserInsightsCached } from "./user-insights-cache";
import { computeFollowerTrend, summarizeFollowerGrowth, parseDemographics } from "./followers";
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
  type PostWithInsights,
} from "./analytics";

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
    .describe(description);

// Datetimes without a timezone would otherwise be parsed in the server's
// local zone, while bare dates are parsed as UTC; pin everything to UTC.
function parseUtc(value: string): Date {
  return new Date(value.includes("T") && !value.endsWith("Z") ? `${value}Z` : value);
}

function parseRange(since?: string, until?: string) {
  const untilDate = until ? parseUtc(until) : new Date();
  const sinceDate = since ? parseUtc(since) : new Date(untilDate.getTime() - DEFAULT_RANGE_MS);
  if (Number.isNaN(untilDate.getTime()) || Number.isNaN(sinceDate.getTime())) {
    throw new Error("Invalid date parameters");
  }
  // A bare YYYY-MM-DD "until" should include that whole day.
  if (until && !until.includes("T")) untilDate.setUTCHours(23, 59, 59, 999);
  if (sinceDate > untilDate) {
    throw new Error("'since' must be on or before 'until'");
  }
  return { since: sinceDate, until: untilDate };
}

const READ_ONLY = { readOnlyHint: true };

async function getActiveAccount() {
  return db.threadsAccount.findFirst({ where: { isActive: true }, include: { syncState: true } });
}

// Engagement excludes shares, matching the app-wide rate (see getMetricRates).
function engagementRate(post: {
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
}) {
  if (post.views <= 0) return null;
  const engagement = post.likes + post.replies + post.reposts + post.quotes;
  return Math.round((engagement / post.views) * 10000) / 100;
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
  const [posts, snapshots] = await Promise.all([
    fetchPosts(accountId, range.since, range.until),
    db.followerSnapshot.findMany({
      where: { accountId, date: { gte: range.since, lte: range.until } },
      orderBy: { date: "asc" },
      select: { followersCount: true },
    }),
  ]);
  const sum = (pick: (p: PostWithInsights) => number) => posts.reduce((s, p) => s + pick(p), 0);
  const views = sum((p) => p.views);
  const engagement = sum((p) => p.likes + p.replies + p.reposts + p.quotes);
  const sortedViews = posts.map((p) => p.views).sort((a, b) => a - b);
  return {
    postCount: posts.length,
    views,
    avgViewsPerPost: posts.length > 0 ? Math.round(views / posts.length) : 0,
    medianViews: sortedViews.length > 0 ? sortedViews[Math.floor(sortedViews.length / 2)] : 0,
    likes: sum((p) => p.likes),
    replies: sum((p) => p.replies),
    reposts: sum((p) => p.reposts),
    quotes: sum((p) => p.quotes),
    shares: sum((p) => p.shares),
    engagementRatePct: views > 0 ? Math.round((engagement / views) * 10000) / 100 : null,
    followerChange:
      snapshots.length >= 2
        ? snapshots[snapshots.length - 1].followersCount - snapshots[0].followersCount
        : null,
  };
}

type PeriodStats = Awaited<ReturnType<typeof computePeriodStats>>;

function diffPeriodStats(primary: PeriodStats, comparison: PeriodStats) {
  const change: Record<string, { change: number; changePct: number | null }> = {};
  for (const key of Object.keys(primary) as Array<keyof PeriodStats>) {
    const a = primary[key];
    const b = comparison[key];
    if (typeof a !== "number" || typeof b !== "number") continue;
    change[key] = {
      change: Math.round((a - b) * 100) / 100,
      changePct: b !== 0 ? Math.round(((a - b) / Math.abs(b)) * 10000) / 100 : null,
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
        "Overview of the connected Threads account: username, sync status, post counts, data date range, and follower growth summary. Call this first to learn what data is available.",
      inputSchema: z.object({}),
    },
    async () => {
      const account = await getActiveAccount();
      if (!account) return errorResult("No active Threads account is connected.");

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
      return jsonResult({
        username: account.username,
        lastSyncedAt: account.syncState?.lastSyncedAt?.toISOString() ?? null,
        accessTokenExpiresAt: account.expiresAt.toISOString(),
        postCount,
        dataRange: {
          oldestPost: oldest?.timestamp.toISOString() ?? null,
          newestPost: newest?.timestamp.toISOString() ?? null,
        },
        followers: summarizeFollowerGrowth(trend),
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
      }),
    },
    async ({ since, until, sort, media_type, query, limit, offset }) => {
      const account = await getActiveAccount();
      if (!account) return errorResult("No active Threads account is connected.");

      let range;
      try {
        range = parseRange(since, until);
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
      inputSchema: z.object({ id: z.string().describe("Post id from list_posts") }),
    },
    async ({ id }) => {
      const account = await getActiveAccount();
      if (!account) return errorResult("No active Threads account is connected.");
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
            "IANA timezone for day/hour bucketing, e.g. 'America/Los_Angeles' (default: the server's configured analytics timezone)",
          ),
      }),
    },
    async ({ since, until, sections, timezone }) => {
      const account = await getActiveAccount();
      if (!account) return errorResult("No active Threads account is connected.");

      let range;
      try {
        range = parseRange(since, until);
      } catch (err) {
        return errorResult((err as Error).message);
      }

      const tz = timezone ?? DEFAULT_TZ;
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
      } catch {
        return errorResult(`Unknown timezone: ${tz}`);
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
        "Daily follower-count snapshots with growth summary, and optionally the latest audience demographics (country, city, age, gender).",
      inputSchema: z.object({
        since: dateArg("Start of the date range (inclusive)"),
        until: dateArg("End of the date range (inclusive)"),
        include_demographics: z
          .boolean()
          .optional()
          .describe("Include the latest demographics breakdown (default false)"),
      }),
    },
    async ({ since, until, include_demographics }) => {
      const account = await getActiveAccount();
      if (!account) return errorResult("No active Threads account is connected.");

      let range;
      try {
        range = parseRange(since, until);
      } catch (err) {
        return errorResult((err as Error).message);
      }

      const snapshots = await db.followerSnapshot.findMany({
        where: { accountId: account.id, date: { gte: range.since, lte: range.until } },
        orderBy: { date: "asc" },
      });
      const trend = computeFollowerTrend(
        snapshots.map((s) => ({ date: s.date, followersCount: s.followersCount })),
      );

      const latestWithDemographics = include_demographics
        ? await db.followerSnapshot.findFirst({
            where: { accountId: account.id, demographics: { not: Prisma.AnyNull } },
            orderBy: { date: "desc" },
          })
        : null;

      return jsonResult({
        summary: summarizeFollowerGrowth(trend),
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
        "Compare core metrics (posts, views, engagement, follower growth) between two periods, with absolute and percentage changes. Defaults: primary period = last 90 days, comparison period = the window of the same length immediately before it.",
      inputSchema: z.object({
        since: dateArg("Start of the primary period (inclusive)"),
        until: dateArg("End of the primary period (inclusive)"),
        compare_since: dateArg("Start of the comparison period (inclusive)"),
        compare_until: dateArg("End of the comparison period (inclusive)"),
      }),
    },
    async ({ since, until, compare_since, compare_until }) => {
      const account = await getActiveAccount();
      if (!account) return errorResult("No active Threads account is connected.");

      let primary;
      let comparison;
      try {
        primary = parseRange(since, until);
        if (compare_since || compare_until) {
          if (!compare_since || !compare_until) {
            return errorResult("Provide both compare_since and compare_until, or neither.");
          }
          comparison = parseRange(compare_since, compare_until);
        } else {
          const length = primary.until.getTime() - primary.since.getTime();
          const compareUntil = new Date(primary.since.getTime() - 1);
          comparison = { since: new Date(compareUntil.getTime() - length), until: compareUntil };
        }
      } catch (err) {
        return errorResult((err as Error).message);
      }

      const [primaryStats, comparisonStats] = await Promise.all([
        computePeriodStats(account.id, primary),
        computePeriodStats(account.id, comparison),
      ]);

      return jsonResult({
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

  const promptText = (text: string) => ({
    messages: [{ role: "user" as const, content: { type: "text" as const, text } }],
  });
  const periodArg = z
    .string()
    .optional()
    .describe("Analysis period, e.g. '30d', '90d', or '2026-01-01 to 2026-03-01' (default 90d)");

  server.registerPrompt(
    "performance-review",
    {
      title: "Performance review",
      description: "A full performance report for a period: trends, wins, and what to improve.",
      argsSchema: z.object({ period: periodArg }),
    },
    ({ period }) =>
      promptText(
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
      argsSchema: z.object({ period: periodArg }),
    },
    ({ period }) =>
      promptText(
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
      argsSchema: z.object({ period: periodArg }),
    },
    ({ period }) =>
      promptText(
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
      argsSchema: z.object({ period: periodArg }),
    },
    ({ period }) =>
      promptText(
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
      argsSchema: z.object({ period: periodArg }),
    },
    ({ period }) =>
      promptText(
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
      argsSchema: z.object({ period: periodArg }),
    },
    ({ period }) =>
      promptText(
        `Analyze which topics and writing patterns work on my Threads for: ${period ?? "the last 90 days"}.\n\n` +
          `Use get_analytics (sections: keyword_analysis, text_feature_comparison, content_type_analysis, ` +
          `top_posts_by_engagement_rate), then read the strongest and weakest posts in full with list_posts + get_post ` +
          `to identify topics beyond single keywords.\n\n` +
          `Tell me: my top-performing topics and why, which writing patterns (questions, links, length, format) help or hurt, ` +
          `which topics to double down on or drop, and 5 post ideas that apply the winning patterns.`,
      ),
  );
}
