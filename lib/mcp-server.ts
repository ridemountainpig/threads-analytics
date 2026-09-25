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
  computeGroupedPerformance,
  getBaselineMedianViews,
  DEFAULT_TZ,
  type PostWithInsights,
} from "./analytics";
import {
  assessDraft,
  assessDrafts,
  DEFAULT_MIN_CONFIDENCE,
  jevConfigured,
  labelTexts,
} from "./jev";
import { evaluateTaxonomy, stratifiedSample, viewsBand } from "./taxonomy";
import {
  analyzePostFeatures,
  analyzeThreadOpeners,
  POST_FEATURES,
  type PostFeature,
} from "./post-features";

const DEFAULT_RANGE_MS = 90 * 24 * 60 * 60 * 1000;
const TEXT_PREVIEW_LENGTH = 300;
const CLASSIFY_MAX_POSTS = 2000;
const THREAD_OPENER_MAX = 1000;
// A part added long after the root joins a post whose views were mostly
// earned before the part existed, which would read as poor retention.
const THREAD_COMPOSED_MAX_GAP_SECONDS = 60 * 60;
const RESUMABLE_NOTE =
  ' Long runs answer {"status": "in_progress"} instead of timing out: wait about 30 seconds and ' +
  "call again with the same arguments (read-only, safe to repeat) — it resumes from the answers " +
  "already cached.";
const JEV_NOT_CONFIGURED =
  "This analysis is not configured on this server. Set AI_GATEWAY_API_KEY (a Vercel AI Gateway key) in the environment.";

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

const taxonomyOptionsArg = z
  .array(
    z.object({
      key: z
        .string()
        .regex(/^(?!uncertain$)[a-z0-9_]+$/, "Use a snake_case key ('uncertain' is reserved)"),
      description: z.string().describe("One sentence defining which posts belong here"),
    }),
  )
  .min(2)
  .max(10);

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

async function computeTopicMix(
  accountId: string,
  primary: { since: Date; until: Date },
  comparison: { since: Date; until: Date },
  question: string,
  options: Array<{ key: string; description: string }>,
) {
  const [primaryPosts, comparisonPosts] = await Promise.all([
    fetchPosts(accountId, primary.since, primary.until).then((p) => p.slice(0, CLASSIFY_MAX_POSTS)),
    fetchPosts(accountId, comparison.since, comparison.until).then((p) =>
      p.slice(0, CLASSIFY_MAX_POSTS),
    ),
  ]);
  const unique = new Map([...primaryPosts, ...comparisonPosts].map((p) => [p.id, p]));
  const { labelById } = await labelTexts(
    [...unique.values()].map((p) => ({ id: p.id, text: p.text })),
    question,
    options,
  );

  const summarize = (posts: PostWithInsights[], label: string) => {
    const members = posts.filter((p) => (labelById.get(p.id) ?? "uncertain") === label);
    const totalViews = members.reduce((sum, p) => sum + p.views, 0);
    return {
      postCount: members.length,
      sharePct: posts.length > 0 ? Math.round((members.length / posts.length) * 1000) / 10 : 0,
      medianViews: getBaselineMedianViews(members),
      totalViews,
    };
  };
  const totalViewsChange =
    primaryPosts.reduce((sum, p) => sum + p.views, 0) -
    comparisonPosts.reduce((sum, p) => sum + p.views, 0);

  return {
    ...((primaryPosts.length === CLASSIFY_MAX_POSTS ||
      comparisonPosts.length === CLASSIFY_MAX_POSTS) && {
      note: `Each period is capped at its ${CLASSIFY_MAX_POSTS} most recent posts.`,
    }),
    totalPostViewsChange: totalViewsChange,
    categories: [...options.map((o) => o.key), "uncertain"]
      .map((option) => {
        const a = summarize(primaryPosts, option);
        const b = summarize(comparisonPosts, option);
        const viewsChange = a.totalViews - b.totalViews;
        return {
          option,
          primary: a,
          comparison: b,
          sharePtsChange: Math.round((a.sharePct - b.sharePct) * 10) / 10,
          totalViewsChange: viewsChange,
          shareOfTotalChangePct:
            totalViewsChange !== 0
              ? Math.round((viewsChange / totalViewsChange) * 1000) / 10
              : null,
        };
      })
      .filter((c) => c.primary.postCount > 0 || c.comparison.postCount > 0)
      .sort((x, y) => Math.abs(y.totalViewsChange) - Math.abs(x.totalViewsChange)),
  };
}

// MCP clients commonly give up on a tool call after 60s. Answering before then
// with "still running" lets the agent retry instead of treating the timeout as
// a failure; the work keeps going and a retry joins it (see lib/jev.ts).
const JEV_TIME_BUDGET_MS = 45_000;
const STILL_RUNNING = Symbol("still running");

async function withinTimeBudget<T>(work: Promise<T>): Promise<T | typeof STILL_RUNNING> {
  let timedOut = false;
  work.catch((err) => {
    if (timedOut) console.error("[mcp] background model work failed:", err);
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<typeof STILL_RUNNING>((resolve) => {
    timer = setTimeout(() => {
      timedOut = true;
      resolve(STILL_RUNNING);
    }, JEV_TIME_BUDGET_MS);
  });
  try {
    return await Promise.race([work, deadline]);
  } finally {
    clearTimeout(timer);
  }
}

function stillRunningResult() {
  return jsonResult({
    status: "in_progress",
    message:
      "The decision model is still working through these posts. The work continues on the server " +
      "and every finished answer is cached. This tool is read-only, so calling it again with exactly " +
      "the same arguments is safe: wait about 30 seconds, then call it again — it picks up where it " +
      "left off. Repeat until you get the full result.",
  });
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
      }),
    },
    async ({ account: accountRef, since, until, sort, media_type, query, limit, offset }) => {
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);
      const { account } = resolved;

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
            "IANA timezone for day/hour bucketing, e.g. 'America/Los_Angeles' (default: the server's configured analytics timezone)",
          ),
      }),
    },
    async ({ account: accountRef, since, until, sections, timezone }) => {
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);
      const { account } = resolved;

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
    "sample_posts_for_taxonomy",
    {
      title: "Sample posts for a taxonomy",
      annotations: READ_ONLY,
      description:
        "Step 1 of building topic categories for classify_posts / score_draft / compare_drafts / " +
        "compare_periods: returns a sample of posts spread evenly across the views distribution " +
        "(top performers through flops, labelled with a viewsBand), so categories you draft from it " +
        "reflect what fails as well as what hits. Read the sample, draft 4-8 mutually exclusive " +
        "categories with a snake_case key and a one-sentence description each, then check them with " +
        "evaluate_taxonomy. Posts without text are skipped.",
      inputSchema: z.object({
        account: accountArg,
        since: dateArg("Start of the date range (inclusive)"),
        until: dateArg("End of the date range (inclusive)"),
        size: z
          .number()
          .int()
          .min(10)
          .max(100)
          .optional()
          .describe("How many posts to sample (default 50)"),
      }),
    },
    async ({ account: accountRef, since, until, size }) => {
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);
      const { account } = resolved;

      let range;
      try {
        range = parseRange(since, until);
      } catch (err) {
        return errorResult((err as Error).message);
      }

      const posts = await fetchPosts(account.id, range.since, range.until);
      const withText = posts.filter((p) => p.text.trim().length > 0).length;
      const sample = stratifiedSample(posts, size ?? 50);
      return jsonResult({
        range: { since: range.since.toISOString(), until: range.until.toISOString() },
        postsInRange: posts.length,
        postsWithText: withText,
        accountMedianViews: getBaselineMedianViews(posts),
        sampleSize: sample.length,
        posts: sample.map(({ post, rank }) => ({
          id: post.id,
          date: post.timestamp.toISOString().slice(0, 10),
          viewsBand: viewsBand(rank, withText),
          views: post.views,
          engagementRatePct: engagementRate(post),
          text: post.text.length > 200 ? `${post.text.slice(0, 200)}…` : post.text,
        })),
      });
    },
  );

  server.registerTool(
    "evaluate_taxonomy",
    {
      title: "Evaluate a taxonomy",
      annotations: READ_ONLY,
      description:
        "Step 2 of building topic categories: classifies the most recent posts with a draft taxonomy, " +
        "then separately checks whether each post really matches the description of the option it was " +
        "put in and of its runner-up. Returns ready (true when no issues were found) and issues — " +
        "plain-language problems to fix: many posts forced into an option they do not match (read " +
        "misfitExamples to find the missing category), an option acting as a catch-all, options too " +
        "small to measure or so large they hide differences, pairs of options that both fit the same " +
        "posts (overlaps, with examples — sharpen the descriptions or merge), and a split that does not " +
        "separate performance at all. Also returns per-category share, misfit rate and median views. " +
        "Revise and call again until ready or the remaining issues are deliberate; the final taxonomy's " +
        "classifications are cached, so classify_posts over the same posts afterwards is fast." +
        RESUMABLE_NOTE,
      inputSchema: z.object({
        account: accountArg,
        since: dateArg("Start of the date range (inclusive)"),
        until: dateArg("End of the date range (inclusive)"),
        question: z
          .string()
          .describe("The question to ask about each post (e.g. 這篇貼文的主要內容類型是什麼？)"),
        options: taxonomyOptionsArg.describe("The draft categories to evaluate"),
        max_posts: z
          .number()
          .int()
          .min(30)
          .max(500)
          .optional()
          .describe(
            "Evaluate on at most this many of the most recent posts in range (default 200)",
          ),
      }),
    },
    async ({ account: accountRef, since, until, question, options, max_posts }) => {
      if (!jevConfigured()) return errorResult(JEV_NOT_CONFIGURED);
      if (new Set(options.map((o) => o.key)).size !== options.length) {
        return errorResult("Option keys must be unique.");
      }
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);
      const { account } = resolved;

      let range;
      try {
        range = parseRange(since, until);
      } catch (err) {
        return errorResult((err as Error).message);
      }

      const posts = (await fetchPosts(account.id, range.since, range.until))
        .filter((p) => p.text.trim().length > 0)
        .slice(0, max_posts ?? 200);
      if (posts.length === 0) return errorResult("No posts with text in range.");

      try {
        const evaluation = await withinTimeBudget(evaluateTaxonomy(posts, question, options));
        if (evaluation === STILL_RUNNING) return stillRunningResult();
        return jsonResult({
          range: { since: range.since.toISOString(), until: range.until.toISOString() },
          ...evaluation,
        });
      } catch (err) {
        console.error("[mcp] evaluate_taxonomy failed:", err);
        return errorResult(`Taxonomy evaluation failed: ${(err as Error).message}`);
      }
    },
  );

  server.registerTool(
    "classify_posts",
    {
      title: "Classify posts",
      annotations: READ_ONLY,
      description:
        "Classify every post in a date range into caller-defined categories with a fast decision model, " +
        "then aggregate performance per category (median/p75 views, hit rate, engagement rate). " +
        "Define 2-10 mutually exclusive options, each with a one-sentence description — classification " +
        "quality depends on the descriptions. The model picks an option confidently even for posts " +
        "that fit none, so each post is also checked separately against its option's description " +
        "(fit_check, on by default): posts that fail it, or whose top probability falls below " +
        "min_confidence, are reported under 'uncertain' instead of skewing a category's stats. " +
        "misfitsByOption shows which options posts were forced into — a large uncertain share means the " +
        "options fit the content poorly, so refine them and ask again. fit_check roughly doubles the " +
        "model calls; turn it off only for a quick rough pass. Covers at most the 2000 most recent " +
        "posts in range (the response includes classifiedOver when truncated). No taxonomy yet? Build " +
        "one with sample_posts_for_taxonomy then evaluate_taxonomy first — their answers are cached " +
        "and reused here." +
        RESUMABLE_NOTE,
      inputSchema: z.object({
        account: accountArg,
        since: dateArg("Start of the date range (inclusive)"),
        until: dateArg("End of the date range (inclusive)"),
        question: z.string().describe("The question to ask about each post's text"),
        options: taxonomyOptionsArg.describe("The mutually exclusive categories to classify into"),
        min_confidence: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .describe("Below this top-option probability a post counts as 'uncertain' (default 0.6)"),
        fit_check: z
          .boolean()
          .optional()
          .describe(
            "Check each post against its option's description and move misfits to 'uncertain' (default true)",
          ),
        examples_per_group: z
          .number()
          .int()
          .min(0)
          .max(5)
          .optional()
          .describe("Top posts by views to include per category (default 3)"),
      }),
    },
    async ({
      account: accountRef,
      since,
      until,
      question,
      options,
      min_confidence,
      fit_check,
      examples_per_group,
    }) => {
      if (!jevConfigured()) {
        return errorResult(
          "Post classification is not configured on this server. Set AI_GATEWAY_API_KEY (a Vercel AI Gateway key) in the environment.",
        );
      }
      if (new Set(options.map((o) => o.key)).size !== options.length) {
        return errorResult("Option keys must be unique.");
      }
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);
      const { account } = resolved;

      let range;
      try {
        range = parseRange(since, until);
      } catch (err) {
        return errorResult((err as Error).message);
      }

      const all = await fetchPosts(account.id, range.since, range.until);
      const posts = all.slice(0, CLASSIFY_MAX_POSTS);
      if (posts.length === 0) {
        return jsonResult({
          range: { since: range.since.toISOString(), until: range.until.toISOString() },
          postCount: 0,
          groups: [],
        });
      }

      const checkFit = fit_check ?? true;
      const threshold = min_confidence ?? DEFAULT_MIN_CONFIDENCE;
      let labelled;
      try {
        labelled = await withinTimeBudget(
          labelTexts(
            posts.map((p) => ({ id: p.id, text: p.text })),
            question,
            options,
            { minConfidence: threshold, fitCheck: checkFit },
          ),
        );
      } catch (err) {
        console.error("[mcp] classify_posts failed:", err);
        return errorResult(`Classification failed: ${(err as Error).message}`);
      }
      if (labelled === STILL_RUNNING) return stillRunningResult();
      const { classified, labelById, lowConfidence, misfitsByOption } = labelled;
      const confidenceById = new Map(classified.map((c) => [c.id, c.confidence]));
      const assignedById = new Map(classified.map((c) => [c.id, c.choice]));
      const uncertainCount = [...labelById.values()].filter((l) => l === "uncertain").length;
      const uncertainPct = Math.round((uncertainCount / posts.length) * 1000) / 10;
      const groups = computeGroupedPerformance(posts, (p) => labelById.get(p.id) ?? "uncertain");

      const exampleCount = examples_per_group ?? 3;
      const byGroup = new Map<string, PostWithInsights[]>();
      for (const post of posts) {
        const label = labelById.get(post.id) ?? "uncertain";
        byGroup.set(label, [...(byGroup.get(label) ?? []), post]);
      }

      const avgConfidence =
        Math.round(
          (classified.reduce((sum, c) => sum + c.confidence, 0) / classified.length) * 100,
        ) / 100;

      return jsonResult({
        range: { since: range.since.toISOString(), until: range.until.toISOString() },
        postCount: posts.length,
        ...(all.length > posts.length && { classifiedOver: posts.length }),
        minConfidence: threshold,
        avgConfidence,
        fitCheck: checkFit,
        uncertain: {
          postCount: uncertainCount,
          sharePct: uncertainPct,
          lowConfidence,
          ...(checkFit && { failedFitCheck: uncertainCount - lowConfidence, misfitsByOption }),
        },
        ...(uncertainPct > 20 && {
          note: "Over 20% of posts fit no option well — run evaluate_taxonomy with these options to find the missing or overloaded category.",
        }),
        groups: groups.map(({ type, ...stats }) => ({
          option: type,
          ...stats,
          examples: (byGroup.get(type) ?? [])
            .sort((a, b) => b.views - a.views)
            .slice(0, exampleCount)
            .map((p) => ({
              id: p.id,
              text: p.text.length > 100 ? `${p.text.slice(0, 100)}…` : p.text,
              views: p.views,
              engagementRatePct: engagementRate(p),
              confidence: confidenceById.get(p.id),
              ...(type === "uncertain" && { assignedTo: assignedById.get(p.id) }),
            })),
        })),
      });
    },
  );

  server.registerTool(
    "score_draft",
    {
      title: "Score a draft post",
      annotations: READ_ONLY,
      description:
        "Pre-publish check for a draft post: a fast decision model rates the draft's hook strength " +
        "(0-3), call-to-action presence, and which of the caller-defined topic categories it belongs " +
        "to, then benchmarks it against the account's historical performance in that topic " +
        "(median/p75 views, hit rate, engagement rate, top examples to imitate). Past posts and the " +
        "draft are labelled exactly as classify_posts does, fit check included: posts that do not " +
        "really match a topic's description stay out of its benchmark, and topicMatch reports how " +
        "well the draft matches its own topic. Pass the same question/options used with " +
        "classify_posts so the draft joins the same taxonomy — the historical classification is " +
        "cached from prior classify_posts runs." +
        RESUMABLE_NOTE,
      inputSchema: z.object({
        account: accountArg,
        draft: z.string().min(1).max(2000).describe("The draft post text to score"),
        question: z
          .string()
          .describe(
            "The topic question, same as used with classify_posts (e.g. 這篇貼文的主要內容類型是什麼？)",
          ),
        options: taxonomyOptionsArg.describe(
          "The topic categories, same as used with classify_posts",
        ),
        since: dateArg("Start of the historical benchmark range (default: last 90 days)"),
        until: dateArg("End of the historical benchmark range"),
      }),
    },
    async ({ account: accountRef, draft, question, options, since, until }) => {
      if (!jevConfigured()) {
        return errorResult(
          "Draft scoring is not configured on this server. Set AI_GATEWAY_API_KEY (a Vercel AI Gateway key) in the environment.",
        );
      }
      if (new Set(options.map((o) => o.key)).size !== options.length) {
        return errorResult("Option keys must be unique.");
      }
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);
      const { account } = resolved;

      let range;
      try {
        range = parseRange(since, until);
      } catch (err) {
        return errorResult((err as Error).message);
      }

      const posts = (await fetchPosts(account.id, range.since, range.until)).slice(
        0,
        CLASSIFY_MAX_POSTS,
      );

      let outcome;
      try {
        outcome = await withinTimeBudget(
          Promise.all([
            assessDraft(draft, question, options),
            labelTexts(
              posts.map((p) => ({ id: p.id, text: p.text })),
              question,
              options,
            ),
          ]),
        );
      } catch (err) {
        console.error("[mcp] score_draft failed:", err);
        return errorResult(`Draft scoring failed: ${(err as Error).message}`);
      }
      if (outcome === STILL_RUNNING) return stillRunningResult();
      const [assessment, { labelById }] = outcome;

      const groups = computeGroupedPerformance(posts, (p) => labelById.get(p.id) ?? "uncertain");
      const benchmark = groups.find((g) => g.type === assessment.topic);
      const topicPosts = posts
        .filter((p) => labelById.get(p.id) === assessment.topic)
        .sort((a, b) => b.views - a.views)
        .slice(0, 2);

      return jsonResult({
        draft: {
          topic: assessment.topic,
          topicConfidence: assessment.topicConfidence,
          topicMatch: assessment.topicMatch,
          topicProbabilities: assessment.topicProbabilities,
          hookScore: assessment.hookScore,
          hookScale: "0 = flat announcement … 3 = sharp pain point / counterintuitive hook",
          ctaProbability: assessment.ctaProbability,
        },
        ...(assessment.topicUncertain && {
          note: "The draft does not clearly match its topic's description — it may straddle categories or fit none, so read the benchmark loosely.",
        }),
        topicBenchmark: benchmark
          ? {
              ...(({ type, ...stats }) => ({ option: type, ...stats }))(benchmark),
              examples: topicPosts.map((p) => ({
                id: p.id,
                text: p.text.length > 100 ? `${p.text.slice(0, 100)}…` : p.text,
                views: p.views,
                engagementRatePct: engagementRate(p),
              })),
            }
          : null,
        accountBenchmark: {
          range: { since: range.since.toISOString(), until: range.until.toISOString() },
          postCount: posts.length,
          medianViews: getBaselineMedianViews(posts),
        },
      });
    },
  );

  server.registerTool(
    "compare_drafts",
    {
      title: "Compare draft variants",
      annotations: READ_ONLY,
      description:
        "Rank 2-5 variants of a draft post before publishing: each variant is rated on hook strength " +
        "(0-3), call-to-action presence, and topic (using the caller-defined categories), then ranked " +
        "by overall = 0.6·(hook/3) + 0.25·topicFit + 0.15·cta, where topicFit compares the topic's " +
        "historical median views to the account median (0.5 = neutral, used when the variant does " +
        "not clearly match its topic — low confidence or a failed topicMatch — or there is no " +
        "history). Past posts are labelled exactly as classify_posts does, fit check included. The response includes per-dimension leaders (null when " +
        "tied within noise) so you can explain WHY a variant wins, not just that it does. Pass the same question/options used with " +
        "classify_posts so variants join the same taxonomy — the historical classification is cached " +
        "from prior runs." +
        RESUMABLE_NOTE,
      inputSchema: z.object({
        account: accountArg,
        drafts: z
          .array(z.string().min(1).max(2000))
          .min(2)
          .max(5)
          .describe("The draft variants to compare, in the order you refer to them"),
        question: z
          .string()
          .describe(
            "The topic question, same as used with classify_posts (e.g. 這篇貼文的主要內容類型是什麼？)",
          ),
        options: taxonomyOptionsArg.describe(
          "The topic categories, same as used with classify_posts",
        ),
        since: dateArg("Start of the historical benchmark range (default: last 90 days)"),
        until: dateArg("End of the historical benchmark range"),
      }),
    },
    async ({ account: accountRef, drafts, question, options, since, until }) => {
      if (!jevConfigured()) {
        return errorResult(
          "Draft scoring is not configured on this server. Set AI_GATEWAY_API_KEY (a Vercel AI Gateway key) in the environment.",
        );
      }
      if (new Set(options.map((o) => o.key)).size !== options.length) {
        return errorResult("Option keys must be unique.");
      }
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);
      const { account } = resolved;

      let range;
      try {
        range = parseRange(since, until);
      } catch (err) {
        return errorResult((err as Error).message);
      }

      const posts = (await fetchPosts(account.id, range.since, range.until)).slice(
        0,
        CLASSIFY_MAX_POSTS,
      );

      let outcome;
      try {
        outcome = await withinTimeBudget(
          Promise.all([
            assessDrafts(drafts, question, options),
            labelTexts(
              posts.map((p) => ({ id: p.id, text: p.text })),
              question,
              options,
            ),
          ]),
        );
      } catch (err) {
        console.error("[mcp] compare_drafts failed:", err);
        return errorResult(`Draft comparison failed: ${(err as Error).message}`);
      }
      if (outcome === STILL_RUNNING) return stillRunningResult();
      const [assessments, { labelById }] = outcome;

      const groups = computeGroupedPerformance(posts, (p) => labelById.get(p.id) ?? "uncertain");
      const accountMedian = getBaselineMedianViews(posts);

      const scored = assessments.map((assessment, index) => {
        const benchmark = groups.find((g) => g.type === assessment.topic);
        const topicFit =
          benchmark && accountMedian > 0 && !assessment.topicUncertain
            ? Math.round((Math.min(benchmark.medianViews / accountMedian, 2) / 2) * 100) / 100
            : 0.5;
        const overall =
          Math.round(
            (0.6 * (assessment.hookScore / 3) +
              0.25 * topicFit +
              0.15 * assessment.ctaProbability) *
              100,
          ) / 100;
        return { index, assessment, benchmark, topicFit, overall };
      });
      const ranking = [...scored].sort((a, b) => b.overall - a.overall);

      const leader = (value: (d: (typeof scored)[number]) => number, epsilon: number) => {
        const byValue = [...scored].sort((a, b) => value(b) - value(a));
        return value(byValue[0]) - value(byValue[1]) >= epsilon ? byValue[0].index + 1 : null;
      };
      const margin = Math.round((ranking[0].overall - ranking[1].overall) * 100) / 100;

      return jsonResult({
        range: { since: range.since.toISOString(), until: range.until.toISOString() },
        postCount: posts.length,
        accountMedianViews: accountMedian,
        hookScale: "0 = flat announcement … 3 = sharp pain point / counterintuitive hook",
        verdict: {
          winner: ranking[0].index + 1,
          margin,
          ...(margin < 0.05 && {
            note: "Top variants are essentially tied — decide on voice and brand fit instead.",
          }),
          dimensionLeaders: {
            hook: leader((d) => d.assessment.hookScore, 0.25),
            topicFit: leader((d) => d.topicFit, 0.1),
            cta: leader((d) => d.assessment.ctaProbability, 0.15),
          },
        },
        ranking: ranking.map((d, i) => ({
          rank: i + 1,
          draft: d.index + 1,
          preview:
            drafts[d.index].length > 80 ? `${drafts[d.index].slice(0, 80)}…` : drafts[d.index],
          overallScore: d.overall,
          hookScore: d.assessment.hookScore,
          ctaProbability: d.assessment.ctaProbability,
          topic: d.assessment.topic,
          topicConfidence: d.assessment.topicConfidence,
          topicMatch: d.assessment.topicMatch,
          topicFit: d.topicFit,
          ...(d.assessment.topicUncertain && {
            note: "The draft does not clearly match its topic's description — topicFit is held neutral (0.5) for the ranking.",
          }),
          topicBenchmark: d.benchmark
            ? (({ type, ...stats }) => ({ option: type, ...stats }))(d.benchmark)
            : null,
        })),
      });
    },
  );

  server.registerTool(
    "analyze_post_features",
    {
      title: "Analyze post features",
      annotations: READ_ONLY,
      description:
        "Find what the account's strongest posts have in common beyond keywords. A fast decision model " +
        "reads each post and answers yes/no for semantic features (personal_story, concrete_numbers, " +
        "contrarian, actionable, emotional, cta) and rates the opening hook 0-3 (hook). Each yes/no " +
        "feature is reported as with-vs-without stats (median views, engagement/reply/share rate) and " +
        "medianViewsLift = with ÷ without (null when either side has under 5 posts); posts the model " +
        "is unsure about are left out of both sides and counted as ambiguousCount. hook reports " +
        "performance per hook level. Features are sorted by lift. Cost scales with posts × features, " +
        "so request only the features you need. Use the same rubric as score_draft: hook and " +
        "cta here are judged exactly as they are for drafts." +
        RESUMABLE_NOTE,
      inputSchema: z.object({
        account: accountArg,
        since: dateArg("Start of the date range (inclusive)"),
        until: dateArg("End of the date range (inclusive)"),
        features: z
          .array(z.enum(POST_FEATURES))
          .min(1)
          .optional()
          .describe("Which features to analyze (default: all)"),
        max_posts: z
          .number()
          .int()
          .min(20)
          .max(1000)
          .optional()
          .describe("Analyze at most this many of the most recent posts in range (default 300)"),
      }),
    },
    async ({ account: accountRef, since, until, features, max_posts }) => {
      if (!jevConfigured()) return errorResult(JEV_NOT_CONFIGURED);
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);
      const { account } = resolved;

      let range;
      try {
        range = parseRange(since, until);
      } catch (err) {
        return errorResult((err as Error).message);
      }

      const all = await fetchPosts(account.id, range.since, range.until);
      const posts = all.slice(0, max_posts ?? 300);
      const wanted: PostFeature[] = features?.length ? [...new Set(features)] : [...POST_FEATURES];
      const header = {
        range: { since: range.since.toISOString(), until: range.until.toISOString() },
        postCount: posts.length,
        ...(all.length > posts.length && {
          analyzedMostRecent: posts.length,
          postsInRange: all.length,
        }),
        accountMedianViews: getBaselineMedianViews(posts),
      };
      if (posts.length === 0) return jsonResult({ ...header, features: [], hook: null });

      try {
        const analysis = await withinTimeBudget(analyzePostFeatures(posts, wanted));
        if (analysis === STILL_RUNNING) return stillRunningResult();
        return jsonResult({ ...header, ...analysis });
      } catch (err) {
        console.error("[mcp] analyze_post_features failed:", err);
        return errorResult(`Feature analysis failed: ${(err as Error).message}`);
      }
    },
  );

  server.registerTool(
    "analyze_thread_openers",
    {
      title: "Analyze thread openers",
      annotations: READ_ONLY,
      description:
        "For multi-part threads: does the way part 1 leads into part 2 change how many readers " +
        "continue? A fast decision model labels each thread's first part as none (reads as " +
        "complete), pointer (says there is more, e.g. 👇, but already delivers its point), or " +
        "open_loop (withholds the payoff so the reader must open part 2). Reports median part-2 " +
        "retention (part-2 views ÷ part-1 views) per label, also split by what part 2 is made of " +
        "(link / linkText / text, since link-only parts retain very differently), with the " +
        "best-retaining examples. Only threads whose part 2 was posted within an hour of part 1 are " +
        "included — a part added much later inherits few of the root's readers. Medians need at " +
        "least 5 threads per group, otherwise they are null." +
        RESUMABLE_NOTE,
      inputSchema: z.object({
        account: accountArg,
        since: dateArg("Start of the date range (inclusive)"),
        until: dateArg("End of the date range (inclusive)"),
      }),
    },
    async ({ account: accountRef, since, until }) => {
      if (!jevConfigured()) return errorResult(JEV_NOT_CONFIGURED);
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);
      const { account } = resolved;

      let range;
      try {
        range = parseRange(since, until);
      } catch (err) {
        return errorResult((err as Error).message);
      }

      const rows = await db.threadReply.findMany({
        where: {
          accountId: account.id,
          position: 2,
          rootPost: {
            timestamp: { gte: range.since, lte: range.until },
            mediaType: { not: "REPOST_FACADE" },
            views: { gt: 0 },
          },
        },
        orderBy: [{ timestamp: "asc" }],
        select: { rootPostId: true, text: true, views: true, gapSeconds: true, rootPost: true },
      });
      // Replying to the root twice leaves two parts at position 2; the thread
      // reads as the earlier one (same pick as the posts page).
      const firstByRoot = new Map<string, (typeof rows)[number]>();
      for (const row of rows) {
        if (!firstByRoot.has(row.rootPostId)) firstByRoot.set(row.rootPostId, row);
      }
      const composed = [...firstByRoot.values()]
        .filter((row) => row.gapSeconds <= THREAD_COMPOSED_MAX_GAP_SECONDS)
        .sort((a, b) => b.rootPost.timestamp.getTime() - a.rootPost.timestamp.getTime())
        .slice(0, THREAD_OPENER_MAX);

      const header = {
        range: { since: range.since.toISOString(), until: range.until.toISOString() },
        threadCount: composed.length,
        excludedLateParts: [...firstByRoot.values()].filter(
          (row) => row.gapSeconds > THREAD_COMPOSED_MAX_GAP_SECONDS,
        ).length,
      };
      if (composed.length === 0) {
        return jsonResult({ ...header, openers: [], note: "No multi-part threads in range." });
      }

      try {
        const result = await withinTimeBudget(
          analyzeThreadOpeners(
            composed.map((row) => ({
              root: {
                id: row.rootPost.id,
                text: row.rootPost.text,
                timestamp: row.rootPost.timestamp,
                mediaType: row.rootPost.mediaType,
                permalink: row.rootPost.permalink,
                views: row.rootPost.views,
                likes: row.rootPost.likes,
                replies: row.rootPost.replies,
                reposts: row.rootPost.reposts,
                quotes: row.rootPost.quotes,
                shares: row.rootPost.shares,
              },
              part2: { text: row.text, views: row.views },
            })),
          ),
        );
        if (result === STILL_RUNNING) return stillRunningResult();
        return jsonResult({ ...header, ...result });
      } catch (err) {
        console.error("[mcp] analyze_thread_openers failed:", err);
        return errorResult(`Thread opener analysis failed: ${(err as Error).message}`);
      }
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
        "Compare core metrics (posts, views, engagement, follower growth) between two periods, with absolute and percentage changes. Defaults: primary period = last 90 days, comparison period = the window of the same length immediately before it. " +
        "Optionally pass question + options (the same taxonomy as classify_posts) to also get topicMix: " +
        "each category's post share, median views and total views in both periods, and its " +
        "contribution to the total change in post views — this explains WHY reach moved (e.g. fewer " +
        "posts of a strong category) rather than only that it moved. topicMix is sorted by the size " +
        "of each category's views change. Posts are labelled exactly as classify_posts does, fit " +
        "check included, so posts that fit no category land in 'uncertain'." +
        RESUMABLE_NOTE,
      inputSchema: z.object({
        account: accountArg,
        since: dateArg("Start of the primary period (inclusive)"),
        until: dateArg("End of the primary period (inclusive)"),
        compare_since: dateArg("Start of the comparison period (inclusive)"),
        compare_until: dateArg("End of the comparison period (inclusive)"),
        question: z
          .string()
          .optional()
          .describe("Topic question for topicMix, same as used with classify_posts"),
        options: taxonomyOptionsArg
          .optional()
          .describe("Topic categories for topicMix, same as used with classify_posts"),
      }),
    },
    async ({
      account: accountRef,
      since,
      until,
      compare_since,
      compare_until,
      question,
      options,
    }) => {
      if (Boolean(question) !== Boolean(options)) {
        return errorResult("Provide both question and options for topicMix, or neither.");
      }
      if (options && new Set(options.map((o) => o.key)).size !== options.length) {
        return errorResult("Option keys must be unique.");
      }
      if (question && !jevConfigured()) return errorResult(JEV_NOT_CONFIGURED);
      const resolved = await resolveAccount(accountRef);
      if ("error" in resolved) return errorResult(resolved.error);
      const { account } = resolved;

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

      let topicMix;
      if (question && options) {
        try {
          topicMix = await withinTimeBudget(
            computeTopicMix(account.id, primary, comparison, question, options),
          );
        } catch (err) {
          console.error("[mcp] compare_periods topicMix failed:", err);
          return errorResult(`Topic classification failed: ${(err as Error).message}`);
        }
        if (topicMix === STILL_RUNNING) return stillRunningResult();
      }

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
        ...(topicMix && { topicMix }),
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
          `to identify topics beyond single keywords. If classify_posts is available, build 4-6 topic categories ` +
          `with sample_posts_for_taxonomy + evaluate_taxonomy, use classify_posts to measure performance per ` +
          `topic across every post in range, and use ` +
          `analyze_post_features to see which writing traits (personal story, numbers, contrarian take, hook ` +
          `strength, …) lift views.\n\n` +
          `Tell me: my top-performing topics and why, which writing patterns (questions, links, length, format) help or hurt, ` +
          `which topics to double down on or drop, and 5 post ideas that apply the winning patterns.`,
      ),
  );

  server.registerPrompt(
    "build-taxonomy",
    {
      title: "Build topic categories",
      description:
        "Work out which content categories fit my posts, check them, and save a reusable taxonomy.",
      argsSchema: z.object({ period: periodArg, account: promptAccountArg }),
    },
    ({ period, account }) =>
      promptText(
        accountLine(account) +
          `Help me define the content categories for my Threads posts over: ${period ?? "the last 90 days"}.\n\n` +
          `1. Call sample_posts_for_taxonomy and read every sampled post, paying attention to how the ` +
          `top 20% differ from the bottom 20%.\n` +
          `2. Draft 4-8 mutually exclusive categories: a snake_case key and a one-sentence description ` +
          `each, plus one question in my posts' language. Prefer an axis that separates what performs ` +
          `from what doesn't over a neat list of subjects.\n` +
          `3. Call evaluate_taxonomy with the draft. Fix every issue it reports — add the category the ` +
          `uncertain posts point to, merge or sharpen overlapping options, merge categories that are ` +
          `too small — and evaluate again. Stop when ready is true or after 3 rounds, and tell me which ` +
          `remaining issues you left on purpose.\n\n` +
          `Finally, show me the taxonomy as a table (key, description, share, median views) and as a ` +
          `JSON block with question and options that I can reuse with classify_posts, score_draft, ` +
          `compare_drafts, and compare_periods.`,
      ),
  );
}
