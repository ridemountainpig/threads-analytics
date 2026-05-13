import { db } from "@/lib/db";
import { decryptToken } from "@/lib/crypto";
import { getUserInsights } from "@/lib/threads-api";
import type { UserInsights } from "@/lib/threads-api";
import { getTimeRange, toUnix } from "@/lib/time-range";
import { resolveRangeParams } from "@/lib/time-range-server";
import { getActiveAccount, getSyncIntervalCached } from "@/lib/dashboard-data";
import {
  computeBestTimeToPost,
  computeDayHourHeatmap,
  computeEngagementRateTrend,
  computeContentTypeAnalysis,
  computePostLengthAnalysis,
  computeWeeklyFrequency,
  computePostingConsistency,
  computeReplyRateLeaders,
  computeEngagementBreakdownByDay,
  computeDayOfWeekPerformance,
  computeTopPostsByEngagementRate,
  computePostingCalendar,
  computeDailyPerformance,
  computePostQualityScatter,
  computeContentFormatLengthMatrix,
  computeActionFunnel,
  computeSharesTrend,
  computeEngagementBreakdownPie,
  computeKeywordAnalysis,
  computeOptimalFrequency,
  computeContentTypeTimeSlot,
  computePostingStreak,
  type PostWithInsights,
} from "@/lib/analytics";
import { StatCard } from "@/components/dashboard/stat-card";
import TimeRangePicker from "@/components/dashboard/time-range-picker";
import SyncButton from "@/components/dashboard/sync-button";
import HourlyBreakdownChart from "@/components/charts/hourly-breakdown-chart";
import EngagementRateChart from "@/components/charts/engagement-rate-chart";
import ContentTypeChart from "@/components/charts/content-type-chart";
import PostLengthChart from "@/components/charts/post-length-chart";
import WeeklyFrequencyChart from "@/components/charts/weekly-frequency-chart";
import EngagementBreakdownChart from "@/components/charts/engagement-breakdown-chart";
import DayOfWeekChart from "@/components/charts/day-of-week-chart";
import PostingActivityCard from "@/components/dashboard/posting-activity-card";
import OverallPerformanceChart from "@/components/charts/overall-performance-chart";
import PostQualityScatterChart from "@/components/charts/post-quality-scatter-chart";
import ActionFunnelChart from "@/components/charts/action-funnel-chart";
import ContentFormatLengthMatrix from "@/components/charts/content-format-length-matrix";
import SharesTrendChart from "@/components/charts/shares-trend-chart";
import EngagementBreakdownPieChart from "@/components/charts/engagement-breakdown-pie-chart";
import KeywordAnalysisChart from "@/components/charts/keyword-analysis-chart";
import OptimalFrequencyChart from "@/components/charts/optimal-frequency-chart";
import ContentTypeTimeSlotChart from "@/components/charts/content-type-time-slot-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnalyticsTabs from "@/components/dashboard/analytics-tabs";
import { ExternalLink } from "lucide-react";
import { dateLocales, getDictionary } from "@/lib/i18n-server";
import { getServerTimezone } from "@/lib/server-timezone";

interface PageProps {
  searchParams: Promise<{ range?: string; from?: string; to?: string; tab?: string }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const { range: rangeParam, from: fromParam, to: toParam, tab: tabParam } = await searchParams;
  const activeTab = tabParam === "content" ? "content" : "performance";
  const [{ locale, t }, account, syncInterval, tz, resolved] = await Promise.all([
    getDictionary(),
    getActiveAccount(),
    getSyncIntervalCached(),
    getServerTimezone(),
    resolveRangeParams({ range: rangeParam, from: fromParam, to: toParam }),
  ]);
  const { range, from, to } = resolved;
  const { since, until } = getTimeRange({ range, from, to }, tz);
  const dateLocale = dateLocales[locale];

  if (!account) {
    return <div className="text-muted-foreground p-8">{t.common.noAccount}</div>;
  }

  let accessToken: string;
  try {
    accessToken = decryptToken(account.accessToken);
  } catch {
    return (
      <div className="text-muted-foreground p-8">{t.common.accountCredentialsUnavailable}</div>
    );
  }
  const emptyUserInsights: UserInsights = {
    views: [],
    totalLikes: 0,
    totalReplies: 0,
    totalReposts: 0,
    totalQuotes: 0,
  };

  const shouldFetchUserInsights = range !== "all";
  const [userInsights, dbPosts] = await Promise.all([
    shouldFetchUserInsights
      ? getUserInsights(account.id, accessToken, toUnix(since), toUnix(until)).catch(
          () => emptyUserInsights,
        )
      : Promise.resolve(emptyUserInsights),
    db.post.findMany({
      where: {
        accountId: account.id,
        timestamp: { gte: since, lte: until },
        mediaType: { not: "REPOST_FACADE" },
      },
      orderBy: { timestamp: "desc" },
      take: 2000,
    }),
  ]);

  const posts: PostWithInsights[] = dbPosts.map((p) => ({
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

  const dbTotalViews = posts.reduce((sum, p) => sum + p.views, 0);
  const dbTotalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
  const dbTotalReplies = posts.reduce((sum, p) => sum + p.replies, 0);
  const dbTotalReposts = posts.reduce((sum, p) => sum + p.reposts, 0);
  const dbTotalQuotes = posts.reduce((sum, p) => sum + p.quotes, 0);
  const hasApiInsights = userInsights.views.length > 0;

  // Performance metrics
  const totalViews = hasApiInsights
    ? userInsights.views.reduce((sum, d) => sum + d.value, 0)
    : dbTotalViews;
  const avgViewsPerDay = userInsights.views.length
    ? Math.round(totalViews / userInsights.views.length)
    : posts.length > 0
      ? Math.round(
          totalViews /
            Math.max(1, Math.ceil((until.getTime() - since.getTime()) / (24 * 60 * 60 * 1000))),
        )
      : 0;
  const totalEngagement =
    (hasApiInsights ? userInsights.totalLikes : dbTotalLikes) +
    (hasApiInsights ? userInsights.totalReplies : dbTotalReplies) +
    (hasApiInsights ? userInsights.totalReposts : dbTotalReposts) +
    (hasApiInsights ? userInsights.totalQuotes : dbTotalQuotes);
  const engRate = totalViews > 0 ? ((totalEngagement / totalViews) * 100).toFixed(2) : "0.00";

  const bestTimeToPost = computeBestTimeToPost(posts, tz);
  const heatmap = computeDayHourHeatmap(posts, tz);
  const dailyPerformance = computeDailyPerformance(posts, userInsights.views, tz);
  const engagementRateTrend = computeEngagementRateTrend(posts, tz);
  const dayOfWeek = computeDayOfWeekPerformance(posts, tz);
  const engagementBreakdown = computeEngagementBreakdownByDay(posts, tz);
  const postQualityScatter = computePostQualityScatter(posts);
  const actionFunnel = computeActionFunnel(posts);

  // Content metrics
  const contentTypeAnalysis = computeContentTypeAnalysis(posts);
  const postLengthAnalysis = computePostLengthAnalysis(posts);
  const weeklyFrequency = computeWeeklyFrequency(posts, tz);
  const consistency = computePostingConsistency(posts, since, until, tz);
  const replyRateLeaders = computeReplyRateLeaders(posts);
  const topByEngRate = computeTopPostsByEngagementRate(posts);
  const postingCalendar = computePostingCalendar(
    posts,
    since,
    until,
    {
      trimEmptyEdges: range === "all",
    },
    tz,
  );
  const contentFormatLengthMatrix = computeContentFormatLengthMatrix(posts);
  const sharesTrend = computeSharesTrend(posts, tz);
  const engagementBreakdownPie = computeEngagementBreakdownPie(posts);
  const keywordAnalysis = computeKeywordAnalysis(posts);
  const optimalFrequency = computeOptimalFrequency(posts, tz);
  const contentTypeTimeSlot = computeContentTypeTimeSlot(posts, tz);
  const postingStreak = computePostingStreak(posts, tz);

  const totalShares = posts.reduce((sum, p) => sum + p.shares, 0);
  const totalQuotes = posts.reduce((sum, p) => sum + p.quotes, 0);
  const totalReposts = posts.reduce((sum, p) => sum + p.reposts, 0);
  const quoteToRepostRatio =
    totalQuotes + totalReposts > 0
      ? Math.round((totalQuotes / (totalQuotes + totalReposts)) * 100)
      : 0;
  const shareRate = totalViews > 0 ? ((totalShares / totalViews) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.analytics.title}</h1>
          <p className="text-muted-foreground text-sm">{t.analytics.subtitle}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:items-end lg:w-auto lg:flex-row lg:items-start lg:gap-4">
          <TimeRangePicker
            locale={locale}
            labels={t.timeRange}
            defaultRange={range}
            defaultFrom={from}
            defaultTo={to}
          />
          <SyncButton
            lastSyncedAt={account.syncState?.lastSyncedAt?.toISOString()}
            syncInterval={syncInterval}
            labels={t.sync}
            dateLocale={dateLocale}
          />
        </div>
      </div>

      <AnalyticsTabs defaultTab={activeTab}>
        <TabsList>
          <TabsTrigger value="performance">{t.analytics.performance}</TabsTrigger>
          <TabsTrigger value="content">{t.analytics.content}</TabsTrigger>
        </TabsList>

        {/* ── PERFORMANCE TAB ── */}
        <TabsContent value="performance" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard title={t.analytics.totalViews} value={totalViews} />
            <StatCard title={t.analytics.avgViewsDay} value={avgViewsPerDay} />
            <StatCard title={t.analytics.engRate} value={`${engRate}%`} />
            <StatCard title={t.analytics.shareRate} value={`${shareRate}%`} />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                {t.analytics.overallPerformance}
              </CardTitle>
              <p className="text-muted-foreground text-xs">{t.analytics.overallPerformanceSub}</p>
            </CardHeader>
            <CardContent>
              <OverallPerformanceChart
                data={dailyPerformance}
                dateLocale={dateLocale}
                labels={t.chart}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                  {t.analytics.postQuality}
                </CardTitle>
                <p className="text-muted-foreground text-xs">{t.analytics.postQualitySub}</p>
              </CardHeader>
              <CardContent>
                <PostQualityScatterChart data={postQualityScatter} labels={t.chart} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                  {t.analytics.actionFunnel}
                </CardTitle>
                <p className="text-muted-foreground text-xs">{t.analytics.actionFunnelSub}</p>
              </CardHeader>
              <CardContent>
                <ActionFunnelChart data={actionFunnel} labels={t.chart} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                  {t.analytics.bestTime}
                </CardTitle>
                <p className="text-muted-foreground text-xs">{t.analytics.bestTimeSub}</p>
              </CardHeader>
              <CardContent>
                <HourlyBreakdownChart
                  heatmap={heatmap}
                  bestTimeToPost={bestTimeToPost}
                  dateLocale={dateLocale}
                  labels={t.chart}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                  {t.analytics.engagementTrend}
                </CardTitle>
                <p className="text-muted-foreground text-xs">{t.analytics.engagementTrendSub}</p>
              </CardHeader>
              <CardContent>
                <EngagementRateChart
                  data={engagementRateTrend}
                  dateLocale={dateLocale}
                  labels={t.chart}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                  {t.analytics.bestDay}
                </CardTitle>
                <p className="text-muted-foreground text-xs">{t.analytics.bestDaySub}</p>
              </CardHeader>
              <CardContent>
                <DayOfWeekChart data={dayOfWeek} labels={t.chart} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                  {t.analytics.formatLengthMatrix}
                </CardTitle>
                <p className="text-muted-foreground text-xs">{t.analytics.formatLengthMatrixSub}</p>
              </CardHeader>
              <CardContent>
                <ContentFormatLengthMatrix data={contentFormatLengthMatrix} labels={t.chart} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                  {t.analytics.engagementBreakdownPie}
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  {t.analytics.engagementBreakdownPieSub}
                </p>
              </CardHeader>
              <CardContent>
                <EngagementBreakdownPieChart data={engagementBreakdownPie} labels={t.chart} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                {t.analytics.engagementBreakdown}
              </CardTitle>
              <p className="text-muted-foreground text-xs">{t.analytics.engagementBreakdownSub}</p>
            </CardHeader>
            <CardContent>
              <EngagementBreakdownChart
                data={engagementBreakdown}
                dateLocale={dateLocale}
                labels={t.chart}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CONTENT TAB ── */}
        <TabsContent value="content" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-xs tracking-wider uppercase">
                  {t.analytics.postingConsistency}
                </p>
                <p className="mt-1 text-2xl font-semibold">{consistency.percentage}%</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {consistency.weeksWithPosts} {t.common.of} {consistency.totalWeeks}{" "}
                  {t.analytics.weeks}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-xs tracking-wider uppercase">
                  {t.analytics.shareRate}
                </p>
                <p className="mt-1 text-2xl font-semibold">{shareRate}%</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {totalShares.toLocaleString()} {t.common.shares}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-xs tracking-wider uppercase">
                  {t.analytics.quoteRatio}
                </p>
                <p className="mt-1 text-2xl font-semibold">{quoteToRepostRatio}%</p>
                <p className="text-muted-foreground mt-0.5 text-xs">{t.analytics.quoteRatioSub}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-xs tracking-wider uppercase">
                  {t.analytics.totalPosts}
                </p>
                <p className="mt-1 text-2xl font-semibold">{posts.length.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-xs tracking-wider uppercase">
                  {t.analytics.longestStreak}
                </p>
                <p className="mt-1 text-2xl font-semibold">{postingStreak.longestStreak}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">{t.analytics.days}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-xs tracking-wider uppercase">
                  {t.analytics.currentStreak}
                </p>
                <p className="mt-1 text-2xl font-semibold">{postingStreak.currentStreak}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">{t.analytics.daysPosted}</p>
              </CardContent>
            </Card>
          </div>

          {/* Posting calendar */}
          <PostingActivityCard
            title={t.analytics.postingActivity}
            subtitle={t.analytics.postingActivitySub}
            data={postingCalendar}
            dateLocale={dateLocale}
            chartLabels={{ ...t.chart, noData: t.common.noData }}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                  {t.analytics.contentTypePerformance}
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  {t.analytics.contentTypePerformanceSub}
                </p>
              </CardHeader>
              <CardContent>
                <ContentTypeChart data={contentTypeAnalysis} labels={t.chart} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                  {t.analytics.postLengthAnalysis}
                </CardTitle>
                <p className="text-muted-foreground text-xs">{t.analytics.postLengthAnalysisSub}</p>
                <p className="text-muted-foreground text-xs">
                  {t.analytics.postLengthAnalysisSub2}
                </p>
              </CardHeader>
              <CardContent>
                <PostLengthChart data={postLengthAnalysis} labels={t.chart} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                {t.analytics.publishingFrequency}
              </CardTitle>
              <p className="text-muted-foreground text-xs">{t.analytics.publishingFrequencySub}</p>
            </CardHeader>
            <CardContent>
              <WeeklyFrequencyChart data={weeklyFrequency} labels={t.chart} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                {t.analytics.sharesTrend}
              </CardTitle>
              <p className="text-muted-foreground text-xs">{t.analytics.sharesTrendSub}</p>
            </CardHeader>
            <CardContent>
              <SharesTrendChart
                data={sharesTrend}
                dateLocale={dateLocale}
                labels={{
                  date: t.chart.date,
                  shares: t.chart.shares,
                  empty: t.analytics.sharesTrendEmpty,
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                {t.analytics.keywordAnalysis}
              </CardTitle>
              <p className="text-muted-foreground text-xs">{t.analytics.keywordAnalysisSub}</p>
            </CardHeader>
            <CardContent>
              <KeywordAnalysisChart
                data={keywordAnalysis}
                labels={{
                  posts: t.chart.posts,
                  avgViews: t.chart.avgViews,
                  engagementRate: t.chart.engagementRate,
                  shareRate: t.chart.shareRate,
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                {t.analytics.optimalFrequency}
              </CardTitle>
              <p className="text-muted-foreground text-xs">{t.analytics.optimalFrequencySub}</p>
            </CardHeader>
            <CardContent>
              <OptimalFrequencyChart
                data={optimalFrequency}
                labels={{
                  range: t.chart.range,
                  postsPerWeek: t.analytics.postsPerWeek,
                  avgViewsPost: t.chart.avgViewsPost,
                  engagementRate: t.chart.engagementRate,
                  shareRate: t.chart.shareRate,
                  weeks: t.chart.week,
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                {t.analytics.contentTypeTimeSlot}
              </CardTitle>
              <p className="text-muted-foreground text-xs">{t.analytics.contentTypeTimeSlotSub}</p>
            </CardHeader>
            <CardContent>
              <ContentTypeTimeSlotChart
                data={contentTypeTimeSlot}
                dateLocale={dateLocale}
                labels={t.chart}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Top by Engagement Rate */}
            {topByEngRate.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                    {t.analytics.topEngagement}
                  </CardTitle>
                  <p className="text-muted-foreground text-xs">{t.analytics.topEngagementSub}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topByEngRate.map((post, i) => (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 border-b py-2 last:border-0"
                    >
                      <span className="text-muted-foreground w-5 shrink-0 text-sm font-medium">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm">{post.text}</p>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-primary text-xs font-medium">
                            {post.engRate}% {t.analytics.engagementShort}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {post.views.toLocaleString()} {t.common.views}
                          </span>
                        </div>
                      </div>
                      {post.permalink && (
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground shrink-0"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Reply-Rate Leaders */}
            {replyRateLeaders.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
                    {t.analytics.replyLeaders}
                  </CardTitle>
                  <p className="text-muted-foreground text-xs">{t.analytics.replyLeadersSub}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {replyRateLeaders.map((post, i) => (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 border-b py-2 last:border-0"
                    >
                      <span className="text-muted-foreground w-5 shrink-0 text-sm font-medium">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm">{post.text}</p>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-primary text-xs font-medium">
                            {post.replyRate}% {t.analytics.replyRate}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {post.replies} {t.common.replies} · {post.views.toLocaleString()}{" "}
                            {t.common.views}
                          </span>
                        </div>
                      </div>
                      {post.permalink && (
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground shrink-0"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </AnalyticsTabs>
    </div>
  );
}
