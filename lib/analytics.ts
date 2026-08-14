export interface PostWithInsights {
  id: string;
  text: string;
  timestamp: Date;
  mediaType: string;
  permalink: string;
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  shares: number;
}

export interface UserViewPoint {
  end_time: string;
  value: number;
}

export interface DailyPerformancePoint {
  date: string;
  views: number;
  postViews: number;
  postCount: number;
  avgViewsPerPost: number;
  engagementRate: number;
  rollingEngagementRate: number;
  shareRate: number;
  shares: number;
}

export type ConfidenceLevel = "low" | "medium" | "high";

export interface DistributionStats {
  avgViews: number;
  medianViews: number;
  p75Views: number;
  hitRate: number;
  confidence: ConfidenceLevel;
}

export interface AnalyticsResult {
  userViews: Array<{ end_time: string; value: number }>;
  dailyPerformance: DailyPerformancePoint[];
  totalEngagement: {
    likes: number;
    replies: number;
    reposts: number;
    quotes: number;
    shares: number;
  };
  bestTimeToPost: HourPerformancePoint[];
  contentTypeAnalysis: CategoryPerformancePoint[];
  dayHourHeatmap: HourHeatmapPoint[];
  postLengthAnalysis: LengthPerformancePoint[];
  weeklyFrequency: WeeklyPerformancePoint[];
  postQualityScatter: PostQualityPoint[];
  contentFormatLengthMatrix: FormatLengthMatrixPoint[];
  actionFunnel: ActionFunnelPoint[];
  viralPosts: Array<{
    id: string;
    text: string;
    timestamp: string;
    views: number;
    permalink: string;
    multiplier: number;
  }>;
  engagementRateTrend: Array<{ date: string; rate: number; rollingAvg: number }>;
  replyRateLeaders: Array<{
    id: string;
    text: string;
    timestamp: string;
    replyRate: number;
    replies: number;
    views: number;
    permalink: string;
  }>;
  sharesTrend: Array<{ date: string; shares: number }>;
  postingConsistency: { totalWeeks: number; weeksWithPosts: number; percentage: number };
  topHours: number[];
  lastSyncedAt?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

export const DEFAULT_TZ =
  process.env.NEXT_PUBLIC_ANALYTICS_TIME_ZONE ?? process.env.ANALYTICS_TIME_ZONE ?? "Asia/Taipei";

const _fmtCache = new Map<string, Intl.DateTimeFormat>();

function _getFormatter(tz: string): Intl.DateTimeFormat {
  let fmt = _fmtCache.get(tz);
  if (!fmt) {
    try {
      fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hourCycle: "h23",
      });
    } catch {
      fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hourCycle: "h23",
      });
    }
    _fmtCache.set(tz, fmt);
  }
  return fmt;
}

function getLocalDateTimeParts(
  date: Date,
  tz: string,
): { year: number; month: number; day: number; hour: number } {
  const parts = _getFormatter(tz).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") };
}

function getISOWeekString(date: Date, tz: string): string {
  const { year, month, day } = getLocalDateTimeParts(date, tz);
  const d = new Date(Date.UTC(year, month - 1, day));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getMonthString(date: Date, tz: string): string {
  const { year, month } = getLocalDateTimeParts(date, tz);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function getDateString(date: Date, tz: string): string {
  const { year, month, day } = getLocalDateTimeParts(date, tz);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDayOfWeek(date: Date, tz: string): number {
  const { year, month, day } = getLocalDateTimeParts(date, tz);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function getHour(date: Date, tz: string): number {
  return getLocalDateTimeParts(date, tz).hour;
}

function getMetricRates(data: {
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  shares: number;
}) {
  const engagement = data.likes + data.replies + data.reposts + data.quotes;
  return {
    engagementRate: data.views > 0 ? Math.round((engagement / data.views) * 10000) / 100 : 0,
    replyRate: data.views > 0 ? Math.round((data.replies / data.views) * 10000) / 100 : 0,
    shareRate: data.views > 0 ? Math.round((data.shares / data.views) * 10000) / 100 : 0,
  };
}

function getPercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(percentile * sorted.length) - 1));
  return sorted[index] ?? 0;
}

function getMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
  }
  return sorted[mid] ?? 0;
}

function getConfidence(count: number): ConfidenceLevel {
  if (count >= 10) return "high";
  if (count >= 3) return "medium";
  return "low";
}

function getDistributionStats(
  bucket: AggregateBucket,
  baselineMedianViews: number,
): DistributionStats {
  const hitCount =
    baselineMedianViews > 0
      ? bucket.views.filter((views) => views >= baselineMedianViews).length
      : 0;
  return {
    avgViews: bucket.count > 0 ? Math.round(bucket.totalViews / bucket.count) : 0,
    medianViews: getMedian(bucket.views),
    p75Views: getPercentile(bucket.views, 0.75),
    hitRate: bucket.count > 0 ? Math.round((hitCount / bucket.count) * 100) : 0,
    confidence: getConfidence(bucket.count),
  };
}

export function getBaselineMedianViews(posts: Array<Pick<PostWithInsights, "views">>) {
  return getMedian(posts.map((post) => post.views).filter((views) => views > 0));
}

interface AggregateBucket {
  totalViews: number;
  totalLikes: number;
  totalReplies: number;
  totalReposts: number;
  totalQuotes: number;
  totalShares: number;
  views: number[];
  count: number;
}

function emptyBucket(): AggregateBucket {
  return {
    totalViews: 0,
    totalLikes: 0,
    totalReplies: 0,
    totalReposts: 0,
    totalQuotes: 0,
    totalShares: 0,
    views: [],
    count: 0,
  };
}

function addPostToBucket(bucket: AggregateBucket, post: PostWithInsights) {
  bucket.totalViews += post.views;
  bucket.totalLikes += post.likes;
  bucket.totalReplies += post.replies;
  bucket.totalReposts += post.reposts;
  bucket.totalQuotes += post.quotes;
  bucket.totalShares += post.shares;
  bucket.views.push(post.views);
  bucket.count += 1;
}

function getRateRankingMinViews(posts: PostWithInsights[]) {
  const views = posts
    .map((p) => p.views)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);
  if (views.length < 5) return 1;
  const median = views[Math.floor(views.length / 2)] ?? 0;
  return Math.max(1, Math.floor(median * 0.5));
}

export interface CategoryPerformancePoint {
  type: string;
  avgLikes: number;
  postCount: number;
  avgViews: number;
  medianViews: number;
  p75Views: number;
  hitRate: number;
  confidence: ConfidenceLevel;
  engagementRate: number;
  replyRate: number;
  shareRate: number;
}

export interface LengthPerformancePoint {
  bucket: string;
  avgLikes: number;
  postCount: number;
  avgViews: number;
  medianViews: number;
  p75Views: number;
  hitRate: number;
  confidence: ConfidenceLevel;
  engagementRate: number;
  replyRate: number;
  shareRate: number;
}

export interface HourPerformancePoint extends DistributionStats {
  hour: number;
  avgLikes: number;
  postCount: number;
}

export interface HourHeatmapPoint extends DistributionStats {
  dayOfWeek: number;
  hour: number;
  postCount: number;
}

export interface WeeklyPerformancePoint {
  week: string;
  postCount: number;
  avgViews: number;
  medianViews: number;
  engagementRate: number;
  shareRate: number;
  hitRate: number;
  confidence: ConfidenceLevel;
}

export type PostQualityQuadrant = "breakout" | "conversation" | "broadcast" | "underperforming";

export interface PostQualityPoint {
  id: string;
  text: string;
  mediaType: string;
  permalink: string;
  views: number;
  engagementRate: number;
  replyRate: number;
  shareRate: number;
  shares: number;
  textLength: number;
  viewsMultiplier: number;
  quadrant: PostQualityQuadrant;
}

export interface FormatLengthMatrixPoint extends DistributionStats {
  mediaType: string;
  lengthBucket: string;
  postCount: number;
}

export interface ActionFunnelPoint {
  action: "Views" | "Likes" | "Replies" | "Reposts" | "Quotes" | "Shares";
  value: number;
  rate: number;
}

// ── Existing Analytics (ported from glaze-sources) ─────────────────────

export function computeBestTimeToPost(
  posts: PostWithInsights[],
  tz = DEFAULT_TZ,
): HourPerformancePoint[] {
  const baselineMedianViews = getBaselineMedianViews(posts);
  const buckets = new Map<number, AggregateBucket>();

  for (const post of posts) {
    const hour = getHour(new Date(post.timestamp), tz);
    const existing = buckets.get(hour) ?? emptyBucket();
    addPostToBucket(existing, post);
    buckets.set(hour, existing);
  }

  return Array.from(buckets.entries())
    .map(([hour, data]) => ({
      hour,
      avgLikes: data.count > 0 ? Math.round(data.totalLikes / data.count) : 0,
      postCount: data.count,
      ...getDistributionStats(data, baselineMedianViews),
    }))
    .sort((a, b) => a.hour - b.hour);
}

export function computeContentTypeAnalysis(posts: PostWithInsights[]): CategoryPerformancePoint[] {
  const baselineMedianViews = getBaselineMedianViews(posts);
  const buckets = new Map<string, AggregateBucket>();

  for (const post of posts) {
    const type = post.mediaType;
    const existing = buckets.get(type) ?? emptyBucket();
    addPostToBucket(existing, post);
    buckets.set(type, existing);
  }

  return Array.from(buckets.entries())
    .map(([type, data]) => ({
      type,
      avgLikes: data.count > 0 ? Math.round(data.totalLikes / data.count) : 0,
      postCount: data.count,
      ...getDistributionStats(data, baselineMedianViews),
      ...getMetricRates({
        views: data.totalViews,
        likes: data.totalLikes,
        replies: data.totalReplies,
        reposts: data.totalReposts,
        quotes: data.totalQuotes,
        shares: data.totalShares,
      }),
    }))
    .sort((a, b) => b.medianViews - a.medianViews);
}

export function computeDayHourHeatmap(
  posts: PostWithInsights[],
  tz = DEFAULT_TZ,
): HourHeatmapPoint[] {
  const baselineMedianViews = getBaselineMedianViews(posts);
  const buckets = new Map<string, AggregateBucket & { dayOfWeek: number; hour: number }>();

  for (const post of posts) {
    const date = new Date(post.timestamp);
    const dayOfWeek = getDayOfWeek(date, tz);
    const hour = getHour(date, tz);
    const key = `${dayOfWeek}-${hour}`;
    const existing = buckets.get(key) ?? { ...emptyBucket(), dayOfWeek, hour };
    addPostToBucket(existing, post);
    buckets.set(key, existing);
  }

  return Array.from(buckets.values()).map((data) => ({
    dayOfWeek: data.dayOfWeek,
    hour: data.hour,
    postCount: data.count,
    ...getDistributionStats(data, baselineMedianViews),
  }));
}

export function computePostLengthAnalysis(posts: PostWithInsights[]): LengthPerformancePoint[] {
  const baselineMedianViews = getBaselineMedianViews(posts);
  const BUCKETS = ["0-50", "51-150", "151-300", "301+"] as const;
  const buckets = new Map<string, AggregateBucket>(BUCKETS.map((b) => [b, emptyBucket()]));

  for (const post of posts) {
    const len = post.text?.length ?? 0;
    const bucketKey = len <= 50 ? "0-50" : len <= 150 ? "51-150" : len <= 300 ? "151-300" : "301+";
    const existing = buckets.get(bucketKey)!;
    addPostToBucket(existing, post);
    buckets.set(bucketKey, existing);
  }

  return BUCKETS.map((bucket) => {
    const data = buckets.get(bucket)!;
    return {
      bucket,
      avgLikes: data.count > 0 ? Math.round(data.totalLikes / data.count) : 0,
      postCount: data.count,
      ...getDistributionStats(data, baselineMedianViews),
      ...getMetricRates({
        views: data.totalViews,
        likes: data.totalLikes,
        replies: data.totalReplies,
        reposts: data.totalReposts,
        quotes: data.totalQuotes,
        shares: data.totalShares,
      }),
    };
  });
}

function getLengthBucket(text: string) {
  const len = text?.length ?? 0;
  return len <= 50 ? "0-50" : len <= 150 ? "51-150" : len <= 300 ? "151-300" : "301+";
}

export function computeWeeklyFrequency(
  posts: PostWithInsights[],
  tz = DEFAULT_TZ,
): WeeklyPerformancePoint[] {
  const baselineMedianViews = getBaselineMedianViews(posts);
  const buckets = new Map<string, AggregateBucket>();

  for (const post of posts) {
    const week = getISOWeekString(new Date(post.timestamp), tz);
    const existing = buckets.get(week) ?? emptyBucket();
    addPostToBucket(existing, post);
    buckets.set(week, existing);
  }

  return Array.from(buckets.entries())
    .map(([week, data]) => {
      const { engagementRate, shareRate } = getMetricRates({
        views: data.totalViews,
        likes: data.totalLikes,
        replies: data.totalReplies,
        reposts: data.totalReposts,
        quotes: data.totalQuotes,
        shares: data.totalShares,
      });
      return {
        week,
        postCount: data.count,
        avgViews: data.count > 0 ? Math.round(data.totalViews / data.count) : 0,
        medianViews: getMedian(data.views),
        hitRate: getDistributionStats(data, baselineMedianViews).hitRate,
        confidence: getConfidence(data.count),
        engagementRate,
        shareRate,
      };
    })
    .sort((a, b) => a.week.localeCompare(b.week));
}

export function computePostQualityScatter(posts: PostWithInsights[]): PostQualityPoint[] {
  const baselineMedianViews = getBaselineMedianViews(posts);
  const engagementRates = posts
    .filter((post) => post.views > 0)
    .map((post) => getMetricRates(post).engagementRate);
  const baselineMedianEngagementRate = getMedian(engagementRates);

  return posts
    .filter((post) => post.views > 0)
    .map((post) => {
      const rates = getMetricRates(post);
      const highViews = post.views >= baselineMedianViews;
      const highEngagement = rates.engagementRate >= baselineMedianEngagementRate;
      const quadrant: PostQualityQuadrant =
        highViews && highEngagement
          ? "breakout"
          : !highViews && highEngagement
            ? "conversation"
            : highViews
              ? "broadcast"
              : "underperforming";

      return {
        id: post.id,
        text: post.text,
        mediaType: post.mediaType,
        permalink: post.permalink,
        views: post.views,
        engagementRate: rates.engagementRate,
        replyRate: rates.replyRate,
        shareRate: rates.shareRate,
        shares: post.shares,
        textLength: post.text?.length ?? 0,
        viewsMultiplier:
          baselineMedianViews > 0 ? Math.round((post.views / baselineMedianViews) * 10) / 10 : 0,
        quadrant,
      };
    })
    .sort((a, b) => b.views - a.views);
}

export function computeContentFormatLengthMatrix(
  posts: PostWithInsights[],
): FormatLengthMatrixPoint[] {
  const baselineMedianViews = getBaselineMedianViews(posts);
  const buckets = new Map<string, AggregateBucket & { mediaType: string; lengthBucket: string }>();

  for (const post of posts) {
    const mediaType = post.mediaType;
    const lengthBucket = getLengthBucket(post.text);
    const key = `${mediaType}:${lengthBucket}`;
    const existing = buckets.get(key) ?? { ...emptyBucket(), mediaType, lengthBucket };
    addPostToBucket(existing, post);
    buckets.set(key, existing);
  }

  return Array.from(buckets.values())
    .map((bucket) => ({
      mediaType: bucket.mediaType,
      lengthBucket: bucket.lengthBucket,
      postCount: bucket.count,
      ...getDistributionStats(bucket, baselineMedianViews),
    }))
    .sort((a, b) => {
      const typeOrder = a.mediaType.localeCompare(b.mediaType);
      return typeOrder === 0 ? a.lengthBucket.localeCompare(b.lengthBucket) : typeOrder;
    });
}

export function computeActionFunnel(
  posts: PostWithInsights[],
  totalViewsFallback?: number,
): ActionFunnelPoint[] {
  const postViews = posts.reduce((sum, post) => sum + post.views, 0);
  const views = totalViewsFallback && totalViewsFallback > 0 ? totalViewsFallback : postViews;
  const totals = {
    Likes: posts.reduce((sum, post) => sum + post.likes, 0),
    Replies: posts.reduce((sum, post) => sum + post.replies, 0),
    Reposts: posts.reduce((sum, post) => sum + post.reposts, 0),
    Quotes: posts.reduce((sum, post) => sum + post.quotes, 0),
    Shares: posts.reduce((sum, post) => sum + post.shares, 0),
  };

  const toPoint = (action: ActionFunnelPoint["action"], value: number): ActionFunnelPoint => ({
    action,
    value,
    rate: views > 0 ? Math.round((value / views) * 10000) / 100 : 0,
  });

  return [
    toPoint("Views", views),
    toPoint("Likes", totals.Likes),
    toPoint("Replies", totals.Replies),
    toPoint("Reposts", totals.Reposts),
    toPoint("Quotes", totals.Quotes),
    toPoint("Shares", totals.Shares),
  ];
}

export function computeViralPosts(posts: PostWithInsights[]): Array<{
  id: string;
  text: string;
  timestamp: string;
  views: number;
  permalink: string;
  multiplier: number;
}> {
  if (posts.length < 3) return [];
  const baselineViews =
    getBaselineMedianViews(posts) ||
    posts.reduce((sum, post) => sum + post.views, 0) / posts.length;
  const threshold = baselineViews * 2;

  return posts
    .filter((p) => p.views > threshold)
    .map((p) => ({
      id: p.id,
      text: p.text,
      timestamp: p.timestamp.toISOString(),
      views: p.views,
      permalink: p.permalink,
      multiplier: baselineViews > 0 ? Math.round((p.views / baselineViews) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, 5);
}

// ── New Analytics ──────────────────────────────────────────────────────

export function computeEngagementRateTrend(
  posts: PostWithInsights[],
  userViews: UserViewPoint[] = [],
  tz = DEFAULT_TZ,
): Array<{ date: string; rate: number; rollingAvg: number; views: number }> {
  const byDate = new Map<string, AggregateBucket>();
  // Prefer profile-level daily views as the denominator (consistent with
  // computeDailyPerformance and the dashboard's headline engagement rate);
  // fall back to summed post views for days the API didn't cover.
  const viewByDate = new Map<string, number>();
  for (const item of userViews) {
    const date = getDateString(new Date(item.end_time), tz);
    viewByDate.set(date, (viewByDate.get(date) ?? 0) + item.value);
  }

  for (const post of posts) {
    const date = getDateString(new Date(post.timestamp), tz);
    const existing = byDate.get(date) ?? emptyBucket();
    addPostToBucket(existing, post);
    byDate.set(date, existing);
  }

  const daily = Array.from(byDate.entries())
    .map(([date, d]) => {
      const views = viewByDate.get(date) ?? d.totalViews;
      return {
        date,
        views,
        rate: getMetricRates({
          views,
          likes: d.totalLikes,
          replies: d.totalReplies,
          reposts: d.totalReposts,
          quotes: d.totalQuotes,
          shares: d.totalShares,
        }).engagementRate,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // 7-day rolling average
  return daily.map((item, i) => {
    const window = daily.slice(Math.max(0, i - 6), i + 1);
    const avg = window.reduce((sum, d) => sum + d.rate, 0) / window.length;
    return { ...item, rollingAvg: Math.round(avg * 100) / 100 };
  });
}

export function computeReplyRateLeaders(posts: PostWithInsights[]): Array<{
  id: string;
  text: string;
  timestamp: string;
  replyRate: number;
  replies: number;
  views: number;
  permalink: string;
}> {
  const minViews = getRateRankingMinViews(posts);
  return posts
    .filter((p) => p.views >= minViews)
    .map((p) => ({
      id: p.id,
      text: p.text,
      timestamp: p.timestamp.toISOString(),
      replyRate: Math.round((p.replies / p.views) * 10000) / 100,
      replies: p.replies,
      views: p.views,
      permalink: p.permalink,
    }))
    .sort((a, b) => b.replyRate - a.replyRate)
    .slice(0, 5);
}

export function computeSharesTrend(
  posts: PostWithInsights[],
  tz = DEFAULT_TZ,
): Array<{ date: string; shares: number }> {
  const byDate = new Map<string, number>();

  for (const post of posts) {
    const date = getDateString(new Date(post.timestamp), tz);
    byDate.set(date, (byDate.get(date) ?? 0) + post.shares);
  }

  return Array.from(byDate.entries())
    .map(([date, shares]) => ({ date, shares }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function computePostingConsistency(
  posts: PostWithInsights[],
  since: Date,
  until: Date,
  tz = DEFAULT_TZ,
): { totalWeeks: number; weeksWithPosts: number; percentage: number } {
  const weeksWithPosts = new Set(posts.map((p) => getISOWeekString(new Date(p.timestamp), tz)));
  // Count the ISO weeks actually spanned by [since, until] using the SAME week
  // definition as weeksWithPosts — otherwise a days/7 estimate undercounts the
  // denominator and the percentage can exceed 100% (e.g. a 7-day window that
  // straddles two ISO weeks). Step by whole UTC days; a daily step can't skip a
  // 7-day week, and getISOWeekString resolves each day in the analytics tz.
  const allWeeks = new Set<string>();
  const cursor = new Date(since);
  while (cursor <= until) {
    allWeeks.add(getISOWeekString(cursor, tz));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  const totalWeeks = Math.max(1, allWeeks.size);
  const weeksWithPostsCount = weeksWithPosts.size;
  return {
    totalWeeks,
    weeksWithPosts: weeksWithPostsCount,
    percentage: Math.min(100, Math.round((weeksWithPostsCount / totalWeeks) * 100)),
  };
}

export function computeTopHours(
  bestTimeToPost: Array<{
    hour: number;
    avgViews: number;
    medianViews?: number;
    postCount: number;
  }>,
): number[] {
  const ranked = bestTimeToPost.filter((h) => h.postCount >= 3);
  const candidates = ranked.length > 0 ? ranked : bestTimeToPost.filter((h) => h.postCount > 0);

  return [...candidates]
    .sort((a, b) => (b.medianViews ?? b.avgViews) - (a.medianViews ?? a.avgViews))
    .slice(0, 3)
    .map((h) => h.hour)
    .sort((a, b) => a - b);
}

export function computeEngagementBreakdownByDay(
  posts: PostWithInsights[],
  tz = DEFAULT_TZ,
): Array<{ date: string; likes: number; replies: number; reposts: number; quotes: number }> {
  const byDate = new Map<
    string,
    { likes: number; replies: number; reposts: number; quotes: number }
  >();
  for (const post of posts) {
    const date = getDateString(new Date(post.timestamp), tz);
    const existing = byDate.get(date) ?? { likes: 0, replies: 0, reposts: 0, quotes: 0 };
    byDate.set(date, {
      likes: existing.likes + post.likes,
      replies: existing.replies + post.replies,
      reposts: existing.reposts + post.reposts,
      quotes: existing.quotes + post.quotes,
    });
  }
  return Array.from(byDate.entries())
    .map(([date, d]) => ({ date, ...d }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function computeDayOfWeekPerformance(
  posts: PostWithInsights[],
  tz = DEFAULT_TZ,
): Array<{
  day: string;
  avgViews: number;
  medianViews: number;
  postCount: number;
  engagementRate: number;
  hitRate: number;
  confidence: ConfidenceLevel;
}> {
  const baselineMedianViews = getBaselineMedianViews(posts);
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets = new Map<number, AggregateBucket>();
  for (const post of posts) {
    const day = getDayOfWeek(new Date(post.timestamp), tz);
    const existing = buckets.get(day) ?? emptyBucket();
    addPostToBucket(existing, post);
    buckets.set(day, existing);
  }
  return Array.from({ length: 7 }, (_, day) => {
    const data = buckets.get(day) ?? emptyBucket();
    return {
      day: DAY_LABELS[day],
      avgViews: data.count > 0 ? Math.round(data.totalViews / data.count) : 0,
      medianViews: getMedian(data.views),
      postCount: data.count,
      hitRate: getDistributionStats(data, baselineMedianViews).hitRate,
      confidence: getConfidence(data.count),
      engagementRate: getMetricRates({
        views: data.totalViews,
        likes: data.totalLikes,
        replies: data.totalReplies,
        reposts: data.totalReposts,
        quotes: data.totalQuotes,
        shares: data.totalShares,
      }).engagementRate,
    };
  });
}

export function computeTopPostsByEngagementRate(
  posts: PostWithInsights[],
  limit = 5,
): Array<{
  id: string;
  text: string;
  timestamp: string;
  engRate: number;
  views: number;
  permalink: string;
}> {
  const minViews = getRateRankingMinViews(posts);
  return posts
    .filter((p) => p.views >= minViews)
    .map((p) => ({
      id: p.id,
      text: p.text,
      timestamp: p.timestamp.toISOString(),
      engRate: Math.round(((p.likes + p.replies + p.reposts + p.quotes) / p.views) * 10000) / 100,
      views: p.views,
      permalink: p.permalink,
    }))
    .sort((a, b) => b.engRate - a.engRate)
    .slice(0, limit);
}

/** Weekday 0=Sun..6=Sat for a calendar Y-M-D (matches analytics date labels). */
function gregorianWeekdaySunday0(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function computePostingCalendar(
  posts: Array<Pick<PostWithInsights, "timestamp">>,
  since: Date,
  until: Date,
  options?: { trimEmptyEdges?: boolean },
  tz = DEFAULT_TZ,
): Array<{ date: string; count: number }> {
  const byDate = new Map<string, number>();
  for (const post of posts) {
    const date = getDateString(new Date(post.timestamp), tz);
    byDate.set(date, (byDate.get(date) ?? 0) + 1);
  }
  const result: Array<{ date: string; count: number }> = [];
  // Walk logical calendar-date keys in UTC so the server's own time zone cannot
  // move either boundary or alter the number of days in the requested range.
  const cursor = new Date(`${getDateString(since, tz)}T00:00:00Z`);
  const end = new Date(`${getDateString(until, tz)}T00:00:00Z`);
  while (cursor <= end) {
    const dateStr = cursor.toISOString().slice(0, 10);
    result.push({ date: dateStr, count: byDate.get(dateStr) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  if (!options?.trimEmptyEdges || result.length === 0) {
    return result;
  }

  let i0 = result.findIndex((r) => r.count > 0);
  let i1 = result.length - 1;
  while (i1 >= 0 && result[i1].count === 0) {
    i1--;
  }
  if (i0 === -1 || i1 < i0) {
    return result;
  }

  const padStart = gregorianWeekdaySunday0(result[i0].date);
  const padEnd = gregorianWeekdaySunday0(result[i1].date);
  i0 = Math.max(0, i0 - padStart);
  i1 = Math.min(result.length - 1, i1 + (6 - padEnd));

  return result.slice(i0, i1 + 1);
}

export function computeDailyPerformance(
  posts: PostWithInsights[],
  userViews: UserViewPoint[],
  tz = DEFAULT_TZ,
): DailyPerformancePoint[] {
  const byDate = new Map<string, AggregateBucket>();
  const viewByDate = new Map<string, number>();

  for (const item of userViews) {
    const date = getDateString(new Date(item.end_time), tz);
    viewByDate.set(date, (viewByDate.get(date) ?? 0) + item.value);
  }

  for (const post of posts) {
    const date = getDateString(new Date(post.timestamp), tz);
    const existing = byDate.get(date) ?? emptyBucket();
    addPostToBucket(existing, post);
    byDate.set(date, existing);
  }

  const dates = new Set([...viewByDate.keys(), ...byDate.keys()]);
  const daily = Array.from(dates)
    .sort((a, b) => a.localeCompare(b))
    .map((date) => {
      const data = byDate.get(date) ?? emptyBucket();
      const views = viewByDate.get(date) ?? data.totalViews;
      const rates = getMetricRates({
        views,
        likes: data.totalLikes,
        replies: data.totalReplies,
        reposts: data.totalReposts,
        quotes: data.totalQuotes,
        shares: data.totalShares,
      });

      return {
        date,
        views,
        postViews: data.totalViews,
        postCount: data.count,
        avgViewsPerPost: data.count > 0 ? Math.round(data.totalViews / data.count) : 0,
        engagementRate: rates.engagementRate,
        rollingEngagementRate: rates.engagementRate,
        shareRate: rates.shareRate,
        shares: data.totalShares,
      };
    });

  return daily.map((item, i) => {
    const window = daily.slice(Math.max(0, i - 6), i + 1);
    const rollingViews = window.reduce((sum, d) => sum + d.views, 0);
    const rolling =
      rollingViews > 0
        ? window.reduce((sum, d) => sum + d.engagementRate * d.views, 0) / rollingViews
        : 0;
    return {
      ...item,
      rollingEngagementRate: Math.round(rolling * 100) / 100,
    };
  });
}

export interface EngagementBreakdownPoint {
  type: "likes" | "replies" | "reposts" | "quotes" | "shares";
  value: number;
  rate: number;
}

export function computeEngagementBreakdownPie(
  posts: PostWithInsights[],
): EngagementBreakdownPoint[] {
  const totals = {
    likes: posts.reduce((s, p) => s + p.likes, 0),
    replies: posts.reduce((s, p) => s + p.replies, 0),
    reposts: posts.reduce((s, p) => s + p.reposts, 0),
    quotes: posts.reduce((s, p) => s + p.quotes, 0),
    shares: posts.reduce((s, p) => s + p.shares, 0),
  };
  const total = totals.likes + totals.replies + totals.reposts + totals.quotes + totals.shares;
  const toPoint = (
    type: EngagementBreakdownPoint["type"],
    value: number,
  ): EngagementBreakdownPoint => ({
    type,
    value,
    rate: total > 0 ? Math.round((value / total) * 10000) / 100 : 0,
  });
  return [
    toPoint("likes", totals.likes),
    toPoint("replies", totals.replies),
    toPoint("reposts", totals.reposts),
    toPoint("quotes", totals.quotes),
    toPoint("shares", totals.shares),
  ];
}

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "it",
  "that",
  "this",
  "was",
  "are",
  "be",
  "have",
  "has",
  "had",
  "not",
  "they",
  "we",
  "you",
  "he",
  "she",
  "i",
  "me",
  "my",
  "we",
  "our",
  "your",
  "his",
  "her",
  "its",
  "their",
  "what",
  "which",
  "who",
  "when",
  "where",
  "why",
  "how",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "because",
  "as",
  "until",
  "while",
  "about",
  "between",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "up",
  "down",
  "out",
  "off",
  "over",
  "under",
  "again",
  "then",
  "once",
  "here",
  "there",
  "where",
  "why",
  "how",
  "all",
  "if",
  "also",
  "am",
  "been",
  "being",
  "could",
  "did",
  "do",
  "does",
  "done",
  "get",
  "got",
  "had",
  "has",
  "have",
  "having",
  "he",
  "her",
  "here",
  "him",
  "himself",
  "herself",
  "into",
  "its",
  "let",
  "may",
  "might",
  "must",
  "need",
  "nor",
  "now",
  "shall",
  "should",
  "still",
  "take",
  "them",
  "these",
  "those",
  "though",
  "through",
  "upon",
  "want",
  "well",
  "were",
  "what",
  "whatever",
  "whom",
  "whose",
  "will",
  "would",
  "yet",
  "的",
  "了",
  "在",
  "是",
  "我",
  "有",
  "和",
  "就",
  "不",
  "人",
  "都",
  "一",
  "一個",
  "這",
  "他",
  "她",
  "它",
  "們",
  "你",
  "嗎",
  "啊",
  "吧",
  "呢",
  "哦",
  "嗯",
  "呀",
  "啦",
  "喔",
  "耶",
  "嘿",
  "也",
  "還",
  "很",
  "說",
  "會",
  "能",
  "可以",
  "the",
  "de",
  "le",
  "la",
  "les",
  "un",
  "une",
  "des",
  "et",
  "ou",
  "mais",
  "dans",
  "sur",
  "pour",
  "avec",
  "ce",
  "se",
  "que",
  "qui",
  "ne",
  "pas",
  "plus",
  "par",
  "en",
  "au",
  "aux",
  "du",
  "est",
  "son",
  "sa",
  "ses",
  "ont",
  "être",
]);

function extractKeywords(text: string): string[] {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[#@]\S+/g, (m) => m.slice(1))
    .replace(/[^\w\u4e00-\u9fff#@]/g, " ")
    .split(/\s+/)
    .filter((w) => {
      if (w.length < 2) return false;
      if (STOP_WORDS.has(w.toLowerCase())) return false;
      if (/^\d+$/.test(w)) return false;
      return true;
    })
    .map((w) => w.toLowerCase());
}

export interface KeywordAnalysisPoint {
  word: string;
  postCount: number;
  avgViews: number;
  avgEngagementRate: number;
  avgShareRate: number;
}

function aggregateTermPerformance(
  posts: PostWithInsights[],
  extract: (text: string) => string[],
  minOccurrences: number,
  limit: number,
): KeywordAnalysisPoint[] {
  const buckets = new Map<
    string,
    { totalViews: number; totalEngagement: number; totalShares: number; count: number }
  >();

  for (const post of posts) {
    const terms = new Set(extract(post.text ?? ""));
    if (terms.size === 0) continue;
    // Accumulate raw counts, not per-post rates, so the final rate is a pooled
    // ratio-of-means (total engagement / total views) rather than a mean of
    // ratios — the latter lets a few low-view posts dominate the ranking.
    const engagement = post.likes + post.replies + post.reposts + post.quotes;
    for (const word of terms) {
      const existing = buckets.get(word) ?? {
        totalViews: 0,
        totalEngagement: 0,
        totalShares: 0,
        count: 0,
      };
      existing.totalViews += post.views;
      existing.totalEngagement += engagement;
      existing.totalShares += post.shares;
      existing.count += 1;
      buckets.set(word, existing);
    }
  }

  return Array.from(buckets.entries())
    .filter(([, data]) => data.count >= minOccurrences)
    .map(([word, data]) => ({
      word,
      postCount: data.count,
      avgViews: Math.round(data.totalViews / data.count),
      avgEngagementRate:
        data.totalViews > 0
          ? Math.round((data.totalEngagement / data.totalViews) * 10000) / 100
          : 0,
      avgShareRate:
        data.totalViews > 0 ? Math.round((data.totalShares / data.totalViews) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)
    .slice(0, limit);
}

export function computeKeywordAnalysis(
  posts: PostWithInsights[],
  minOccurrences = 3,
  limit = 15,
): KeywordAnalysisPoint[] {
  return aggregateTermPerformance(posts, extractKeywords, minOccurrences, limit);
}

export interface OptimalFrequencyPoint {
  range: string;
  postCount: number;
  weekCount: number;
  avgViewsPerPost: number;
  engagementRate: number;
  shareRate: number;
}

export function computeOptimalFrequency(
  posts: PostWithInsights[],
  tz = DEFAULT_TZ,
): OptimalFrequencyPoint[] {
  const weekBuckets = new Map<string, AggregateBucket>();
  for (const post of posts) {
    const week = getISOWeekString(new Date(post.timestamp), tz);
    const existing = weekBuckets.get(week) ?? emptyBucket();
    addPostToBucket(existing, post);
    weekBuckets.set(week, existing);
  }

  const freqBuckets = new Map<
    string,
    {
      totalViews: number;
      totalEngagement: number;
      totalShares: number;
      totalPosts: number;
      weekCount: number;
    }
  >();

  const RANGES = ["1", "2", "3-4", "5-6", "7+"];

  function getRange(count: number): string {
    if (count <= 1) return "1";
    if (count === 2) return "2";
    if (count <= 4) return "3-4";
    if (count <= 6) return "5-6";
    return "7+";
  }

  for (const [, data] of weekBuckets.entries()) {
    const range = getRange(data.count);
    const existing = freqBuckets.get(range) ?? {
      totalViews: 0,
      totalEngagement: 0,
      totalShares: 0,
      totalPosts: 0,
      weekCount: 0,
    };
    // Pool raw counts across all weeks in the range, then take one ratio at the
    // end (ratio-of-means) instead of averaging each week's rate — equal-weight
    // averaging lets a quiet week swing the bucket as much as a busy one.
    existing.totalViews += data.totalViews;
    existing.totalEngagement +=
      data.totalLikes + data.totalReplies + data.totalReposts + data.totalQuotes;
    existing.totalShares += data.totalShares;
    existing.totalPosts += data.count;
    existing.weekCount += 1;
    freqBuckets.set(range, existing);
  }

  return RANGES.filter((r) => freqBuckets.has(r)).map((range) => {
    const data = freqBuckets.get(range)!;
    return {
      range,
      postCount: data.totalPosts,
      weekCount: data.weekCount,
      avgViewsPerPost: data.totalPosts > 0 ? Math.round(data.totalViews / data.totalPosts) : 0,
      engagementRate:
        data.totalViews > 0
          ? Math.round((data.totalEngagement / data.totalViews) * 10000) / 100
          : 0,
      shareRate:
        data.totalViews > 0 ? Math.round((data.totalShares / data.totalViews) * 10000) / 100 : 0,
    };
  });
}

export interface ContentTypeTimeSlot {
  mediaType: string;
  hour: number;
  postCount: number;
  medianViews: number;
  avgViews: number;
  confidence: ConfidenceLevel;
}

export function computeContentTypeTimeSlot(
  posts: PostWithInsights[],
  tz = DEFAULT_TZ,
): ContentTypeTimeSlot[] {
  const baselineMedianViews = getBaselineMedianViews(posts);
  const buckets = new Map<string, AggregateBucket & { mediaType: string; hour: number }>();

  for (const post of posts) {
    const hour = getHour(new Date(post.timestamp), tz);
    const mediaType = post.mediaType;
    const key = `${mediaType}:${hour}`;
    const existing = buckets.get(key) ?? { ...emptyBucket(), mediaType, hour };
    addPostToBucket(existing, post);
    buckets.set(key, existing);
  }

  return Array.from(buckets.values()).map((bucket) => ({
    mediaType: bucket.mediaType,
    hour: bucket.hour,
    postCount: bucket.count,
    medianViews: getMedian(bucket.views),
    avgViews: bucket.count > 0 ? Math.round(bucket.totalViews / bucket.count) : 0,
    confidence: getConfidence(bucket.count),
  }));
}

export interface ViewsTrendPoint {
  period: string;
  postCount: number;
  medianViews: number;
  avgViews: number;
  p75Views: number;
}

export interface ViewsTrendResult {
  granularity: "week" | "month";
  points: ViewsTrendPoint[];
}

// Beyond this many distinct weeks, a weekly series is too noisy to answer
// "is the account growing?" — roll up to months instead.
const VIEWS_TREND_MAX_WEEKS = 16;

export function computeViewsTrend(posts: PostWithInsights[], tz = DEFAULT_TZ): ViewsTrendResult {
  const weekKeys = new Set(posts.map((post) => getISOWeekString(new Date(post.timestamp), tz)));
  const granularity: ViewsTrendResult["granularity"] =
    weekKeys.size > VIEWS_TREND_MAX_WEEKS ? "month" : "week";
  const keyOf =
    granularity === "month"
      ? (date: Date) => getMonthString(date, tz)
      : (date: Date) => getISOWeekString(date, tz);

  const buckets = new Map<string, AggregateBucket>();
  for (const post of posts) {
    const key = keyOf(new Date(post.timestamp));
    const existing = buckets.get(key) ?? emptyBucket();
    addPostToBucket(existing, post);
    buckets.set(key, existing);
  }

  const points = Array.from(buckets.entries())
    .map(([period, data]) => ({
      period,
      postCount: data.count,
      medianViews: getMedian(data.views),
      avgViews: data.count > 0 ? Math.round(data.totalViews / data.count) : 0,
      p75Views: getPercentile(data.views, 0.75),
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  return { granularity, points };
}

export interface ViewsDistributionPoint {
  bucket: string;
  count: number;
  percentage: number;
}

export interface ViewsMilestonePoint {
  threshold: number;
  count: number;
  percentage: number;
}

export interface ViewsDistributionResult {
  totalPosts: number;
  buckets: ViewsDistributionPoint[];
  milestones: ViewsMilestonePoint[];
}

// Bucket boundaries and milestones adapt to each account's view scale, snapped
// to a 1 / 2.5 / 5 ladder so labels stay readable ("250", "1k", "2.5k", ...).
const VIEW_THRESHOLD_LADDER: number[] = Array.from({ length: 8 }, (_, exp) =>
  [1, 2.5, 5].map((step) => step * 10 ** (exp + 1)),
)
  .flat()
  .map(Math.round);

function snapToLadder(value: number): number {
  if (value <= VIEW_THRESHOLD_LADDER[0]!) return VIEW_THRESHOLD_LADDER[0]!;
  return VIEW_THRESHOLD_LADDER.reduce((best, rung) =>
    Math.abs(Math.log(rung) - Math.log(value)) < Math.abs(Math.log(best) - Math.log(value))
      ? rung
      : best,
  );
}

function nextLadderRung(value: number): number {
  return (
    VIEW_THRESHOLD_LADDER.find((rung) => rung > value) ??
    VIEW_THRESHOLD_LADDER[VIEW_THRESHOLD_LADDER.length - 1]!
  );
}

function viewsQuantile(sortedViews: number[], q: number): number {
  const index = Math.min(sortedViews.length - 1, Math.floor(q * sortedViews.length));
  return sortedViews[index] ?? 0;
}

function formatViewsLabel(value: number): string {
  if (value >= 1_000_000) return `${value / 1_000_000}m`;
  if (value >= 1_000) return `${value / 1_000}k`;
  return String(value);
}

export function computeViewsDistribution(posts: PostWithInsights[]): ViewsDistributionResult {
  const total = posts.length;
  const pct = (count: number) => (total > 0 ? Math.round((count / total) * 1000) / 10 : 0);
  if (total === 0) return { totalPosts: 0, buckets: [], milestones: [] };

  const sortedViews = posts.map((post) => post.views).sort((a, b) => a - b);

  const boundaries = [
    ...new Set(
      [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875].map((q) =>
        snapToLadder(viewsQuantile(sortedViews, q)),
      ),
    ),
  ].sort((a, b) => a - b);

  const counts = Array.from({ length: boundaries.length + 1 }, () => 0);
  for (const post of posts) {
    const index = boundaries.findIndex((boundary) => post.views <= boundary);
    counts[index === -1 ? boundaries.length : index] += 1;
  }

  const bucketLabel = (index: number): string => {
    if (index === boundaries.length) return `${formatViewsLabel(boundaries[index - 1]!)}+`;
    if (index === 0) return `0-${formatViewsLabel(boundaries[0]!)}`;
    const prev = boundaries[index - 1]!;
    const lower = prev < 1_000 ? String(prev + 1) : formatViewsLabel(prev);
    return `${lower}-${formatViewsLabel(boundaries[index]!)}`;
  };

  // Milestones track the "nice" thresholds closest to the top 50% / 25% / 10%
  // of this account's posts, bumped up the ladder when quantiles collide.
  const milestoneThresholds: number[] = [];
  for (const q of [0.5, 0.75, 0.9]) {
    let threshold = snapToLadder(viewsQuantile(sortedViews, q));
    const last = milestoneThresholds[milestoneThresholds.length - 1];
    if (last !== undefined && threshold <= last) threshold = nextLadderRung(last);
    milestoneThresholds.push(threshold);
  }

  return {
    totalPosts: total,
    buckets: counts.map((count, index) => ({
      bucket: bucketLabel(index),
      count,
      percentage: pct(count),
    })),
    milestones: milestoneThresholds.map((threshold) => {
      const count = posts.filter((post) => post.views >= threshold).length;
      return { threshold, count, percentage: pct(count) };
    }),
  };
}

export function computeShareLeaders(posts: PostWithInsights[]): Array<{
  id: string;
  text: string;
  timestamp: string;
  shareRate: number;
  shares: number;
  views: number;
  permalink: string;
}> {
  const minViews = getRateRankingMinViews(posts);
  return posts
    .filter((p) => p.views >= minViews && p.shares > 0)
    .map((p) => ({
      id: p.id,
      text: p.text,
      timestamp: p.timestamp.toISOString(),
      shareRate: Math.round((p.shares / p.views) * 10000) / 100,
      shares: p.shares,
      views: p.views,
      permalink: p.permalink,
    }))
    .sort((a, b) => b.shareRate - a.shareRate)
    .slice(0, 5);
}

export interface TextFeatureStats {
  postCount: number;
  medianViews: number;
  engagementRate: number;
  replyRate: number;
  shareRate: number;
}

export interface TextFeatureComparisonPoint {
  feature: "link" | "question";
  withFeature: TextFeatureStats;
  withoutFeature: TextFeatureStats;
}

const hasLink = (text: string) => /https?:\/\//i.test(text);
const hasQuestion = (text: string) => text.includes("?") || text.includes("？");

export function computeTextFeatureComparison(
  posts: PostWithInsights[],
): TextFeatureComparisonPoint[] {
  const statsFor = (subset: PostWithInsights[]): TextFeatureStats => {
    const bucket = emptyBucket();
    for (const post of subset) addPostToBucket(bucket, post);
    const rates = getMetricRates({
      views: bucket.totalViews,
      likes: bucket.totalLikes,
      replies: bucket.totalReplies,
      reposts: bucket.totalReposts,
      quotes: bucket.totalQuotes,
      shares: bucket.totalShares,
    });
    return {
      postCount: bucket.count,
      medianViews: getMedian(bucket.views),
      engagementRate: rates.engagementRate,
      replyRate: rates.replyRate,
      shareRate: rates.shareRate,
    };
  };

  const features: Array<{
    feature: TextFeatureComparisonPoint["feature"];
    test: (text: string) => boolean;
  }> = [
    { feature: "link", test: hasLink },
    { feature: "question", test: hasQuestion },
  ];

  return features.map(({ feature, test }) => ({
    feature,
    withFeature: statsFor(posts.filter((p) => test(p.text ?? ""))),
    withoutFeature: statsFor(posts.filter((p) => !test(p.text ?? ""))),
  }));
}

export type PostingGapBucket = "0" | "1" | "2-3" | "4-7" | "8+";

export interface PostingGapPoint {
  gap: PostingGapBucket;
  postCount: number;
  medianViews: number;
  avgViews: number;
  engagementRate: number;
  hitRate: number;
  confidence: ConfidenceLevel;
}

/**
 * Buckets each post by how many calendar days passed since the previous post
 * ("0" = another post the same day, "1" = posted the next day, i.e. a
 * consecutive-day streak), then compares reach across buckets. The first post
 * in the range has no gap and is skipped.
 */
export function computePostingGapAnalysis(
  posts: PostWithInsights[],
  tz = DEFAULT_TZ,
): PostingGapPoint[] {
  if (posts.length < 2) return [];
  const baselineMedianViews = getBaselineMedianViews(posts);
  const sorted = [...posts].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const GAPS: PostingGapBucket[] = ["0", "1", "2-3", "4-7", "8+"];
  const buckets = new Map<PostingGapBucket, AggregateBucket>(GAPS.map((g) => [g, emptyBucket()]));

  for (let i = 1; i < sorted.length; i++) {
    const prevDay = getDateString(new Date(sorted[i - 1].timestamp), tz);
    const curDay = getDateString(new Date(sorted[i].timestamp), tz);
    const diffDays = Math.round(
      (Date.parse(`${curDay}T00:00:00Z`) - Date.parse(`${prevDay}T00:00:00Z`)) / 86400000,
    );
    const key: PostingGapBucket =
      diffDays <= 0
        ? "0"
        : diffDays === 1
          ? "1"
          : diffDays <= 3
            ? "2-3"
            : diffDays <= 7
              ? "4-7"
              : "8+";
    addPostToBucket(buckets.get(key)!, sorted[i]);
  }

  return GAPS.map((gap) => {
    const data = buckets.get(gap)!;
    const stats = getDistributionStats(data, baselineMedianViews);
    const rates = getMetricRates({
      views: data.totalViews,
      likes: data.totalLikes,
      replies: data.totalReplies,
      reposts: data.totalReposts,
      quotes: data.totalQuotes,
      shares: data.totalShares,
    });
    return {
      gap,
      postCount: data.count,
      medianViews: stats.medianViews,
      avgViews: stats.avgViews,
      hitRate: stats.hitRate,
      confidence: stats.confidence,
      engagementRate: rates.engagementRate,
    };
  }).filter((point) => point.postCount > 0);
}

export interface PostingStreak {
  longestStreak: number;
  currentStreak: number;
  totalDaysWithPosts: number;
}

export function computePostingStreak(
  posts: PostWithInsights[],
  tz = DEFAULT_TZ,
  now = new Date(),
): PostingStreak {
  const daysWithPosts = new Set(posts.map((p) => getDateString(new Date(p.timestamp), tz)));
  const sorted = Array.from(daysWithPosts).sort();

  let longestStreak = 0;
  let currentStreak = 0;
  let prev: Date | null = null;

  for (const day of sorted) {
    const d = new Date(day + "T12:00:00Z");
    if (prev) {
      const diff = (d.getTime() - prev.getTime()) / 86400000;
      currentStreak = diff === 1 ? currentStreak + 1 : 1;
    } else {
      currentStreak = 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
    prev = d;
  }

  const today = getDateString(now, tz);
  const todayDate = new Date(today + "T12:00:00Z");
  const cursor = new Date(todayDate);

  // A streak stays "active" until a full day is missed, so if nothing is posted
  // yet today the run through yesterday should still count — start from
  // yesterday rather than reporting 0. Step by whole UTC days from the noon-UTC
  // anchor so the local (tz) calendar date advances exactly once per iteration.
  if (!daysWithPosts.has(getDateString(cursor, tz))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let streakFromToday = 0;
  while (daysWithPosts.has(getDateString(cursor, tz))) {
    streakFromToday++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return {
    longestStreak,
    currentStreak: streakFromToday,
    totalDaysWithPosts: sorted.length,
  };
}
