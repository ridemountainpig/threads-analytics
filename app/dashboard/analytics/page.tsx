import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma";
import { decryptToken } from "@/lib/crypto";
import { getUserInsightsCached } from "@/lib/user-insights-cache";
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
  computeViewsTrend,
  computeViewsDistribution,
  computeShareLeaders,
  computeTextFeatureComparison,
  computePostingGapAnalysis,
  getDateString,
  DEFAULT_TZ,
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
import ViewsTrendChart from "@/components/charts/views-trend-chart";
import ViewsDistributionChart from "@/components/charts/views-distribution-chart";
import TextFeatureComparison from "@/components/charts/text-feature-comparison";
import PostingGapChart from "@/components/charts/posting-gap-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChartCard from "@/components/dashboard/chart-card";
import { ChartEmptyState } from "@/components/charts/chart-chrome";
import { chartColors } from "@/components/charts/chart-style";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnalyticsTabs, { type AnalyticsTabValue } from "@/components/dashboard/analytics-tabs";
import FollowerTrendChart from "@/components/charts/follower-trend-chart";
import FollowerDemographicsChart from "@/components/charts/follower-demographics-chart";
import {
  compareDemographics,
  computeDemographicTrend,
  computeFollowerTrend,
  dateKeyToUtcDate,
  utcDateToKey,
  hasDemographicData,
  parseDemographics,
  summarizeFollowerGrowth,
  type DemographicBreakdown,
  type DemographicSlice,
  type DemographicTrendResult,
} from "@/lib/followers";
import DemographicTrendChart from "@/components/charts/demographic-trend-chart";
import DemographicDatePicker from "@/components/dashboard/demographic-date-picker";
import { buildDemographicLabels } from "@/lib/demographic-labels";
import { DEMOGRAPHIC_BREAKDOWNS, DEMOGRAPHICS_MIN_FOLLOWERS } from "@/lib/threads-api";
import { NoAccountNotice } from "@/components/dashboard/no-account-notice";
import { TokenExpiredNotice } from "@/components/dashboard/token-expired-notice";
import { FirstSyncNotice } from "@/components/dashboard/first-sync-notice";
import { ExternalLink } from "lucide-react";
import { dateLocales, getDictionary } from "@/lib/i18n-server";
import { getServerTimezone } from "@/lib/server-timezone";

interface PageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    tab?: string;
    /** Demographic comparison endpoints, as YYYY-MM-DD snapshot dates. */
    dFrom?: string;
    dTo?: string;
  }>;
}

/** How many of the most recent snapshots the comparison spans by default. */
const DEFAULT_COMPARISON_SPAN = 90;

/** Snapshot dates are calendar dates stored at UTC midnight — format them as such. */
function formatSnapshotDate(date: Date, dateLocale: string) {
  return new Intl.DateTimeFormat(dateLocale, {
    timeZone: "UTC",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const {
    range: rangeParam,
    from: fromParam,
    to: toParam,
    tab: tabParam,
    dFrom: dFromParam,
    dTo: dToParam,
  } = await searchParams;
  const activeTab: AnalyticsTabValue =
    tabParam === "content" || tabParam === "audience" ? tabParam : "performance";
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
  const cardLabels = { expand: t.common.expand, close: t.common.close };

  if (!account) {
    return (
      <NoAccountNotice
        message={t.common.noAccount}
        help={t.common.noAccountHelp}
        settingsLabel={t.common.settings}
      />
    );
  }

  if (account.expiresAt < new Date()) {
    return (
      <TokenExpiredNotice
        message={t.common.tokenExpired}
        help={t.common.tokenExpiredHelp}
        settingsLabel={t.common.settings}
      />
    );
  }

  if (!account.syncState?.lastSyncedAt) {
    return (
      <FirstSyncNotice
        labels={{
          message: t.common.notSynced,
          help: t.common.notSyncedHelp,
          syncNow: t.common.syncNow,
          syncing: t.sync.syncing,
          inProgress: t.sync.inProgress,
          tokenExpired: t.sync.tokenExpired,
          failed: t.sync.failed,
          synced: t.sync.synced,
        }}
      />
    );
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

  // Follower snapshots are stored as calendar dates (UTC midnight), so the range
  // instants are reduced to date keys before comparing. The reduction uses
  // DEFAULT_TZ — the same zone captureFollowerSnapshot buckets days by — because
  // using the viewer's zone would put "today" on a different calendar day than
  // the row that was just written, dropping the newest point from the chart.
  const sinceDate = dateKeyToUtcDate(getDateString(since, DEFAULT_TZ));
  const untilDate = dateKeyToUtcDate(getDateString(until, DEFAULT_TZ));

  const shouldFetchUserInsights = range !== "all";
  const [
    userInsights,
    dbPosts,
    allPostTimestamps,
    followerSnapshots,
    demographicDates,
    latestSnapshot,
  ] = await Promise.all([
    shouldFetchUserInsights
      ? getUserInsightsCached(account.id, accessToken, toUnix(since), toUnix(until)).catch(
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
    db.post.findMany({
      where: {
        accountId: account.id,
        mediaType: { not: "REPOST_FACADE" },
      },
      select: { timestamp: true },
      orderBy: { timestamp: "asc" },
    }),
    db.followerSnapshot.findMany({
      where: { accountId: account.id, date: { gte: sinceDate, lte: untilDate } },
      select: { date: true, followersCount: true },
      orderBy: { date: "asc" },
    }),
    // Dates only, so the picker can offer exactly the days that have data. The
    // demographics payloads are fetched afterwards for the chosen window alone.
    db.followerSnapshot.findMany({
      where: { accountId: account.id, demographics: { not: Prisma.DbNull } },
      select: { date: true },
      orderBy: { date: "asc" },
    }),
    // Separates "nothing captured yet" from "captured, but under the
    // demographics threshold", so the empty state can say which one it is.
    db.followerSnapshot.findFirst({
      where: { accountId: account.id },
      select: { followersCount: true },
      orderBy: { date: "desc" },
    }),
  ]);

  // The demographic comparison is driven by two explicitly chosen snapshot dates
  // rather than the time-range picker: these metrics are point-in-time readings,
  // and only days that were actually captured can be compared.
  const demographicDateKeys = demographicDates.map((snapshot) => utcDateToKey(snapshot.date));
  const isAvailable = (key: string | undefined): key is string =>
    key !== undefined && demographicDateKeys.includes(key);
  const currentDateKey = isAvailable(dToParam)
    ? dToParam
    : demographicDateKeys[demographicDateKeys.length - 1];
  // Default to a bounded window rather than all of history: the payload below
  // carries one demographics blob per day in range, and defaulting to "every
  // snapshot ever" would grow the cost of every page load forever. Picking an
  // older baseline explicitly still works — the picker offers every date.
  let baselineDateKey = isAvailable(dFromParam)
    ? dFromParam
    : demographicDateKeys[Math.max(0, demographicDateKeys.length - DEFAULT_COMPARISON_SPAN)];
  if (baselineDateKey && currentDateKey && baselineDateKey > currentDateKey) {
    baselineDateKey = currentDateKey;
  }

  const windowDemographicSnapshots =
    baselineDateKey && currentDateKey
      ? await db.followerSnapshot.findMany({
          where: {
            accountId: account.id,
            demographics: { not: Prisma.DbNull },
            date: {
              gte: dateKeyToUtcDate(baselineDateKey),
              lte: dateKeyToUtcDate(currentDateKey),
            },
          },
          select: { date: true, demographics: true },
          orderBy: { date: "asc" },
        })
      : [];

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
  const engagementRateTrend = computeEngagementRateTrend(posts, userInsights.views, tz);
  const dayOfWeek = computeDayOfWeekPerformance(posts, tz);
  const engagementBreakdown = computeEngagementBreakdownByDay(posts, tz);
  const postQualityScatter = computePostQualityScatter(posts);
  const actionFunnel = computeActionFunnel(posts);
  const viewsTrend = computeViewsTrend(posts, tz);
  const viewsDistribution = computeViewsDistribution(posts);

  // Content metrics
  const contentTypeAnalysis = computeContentTypeAnalysis(posts);
  const postLengthAnalysis = computePostLengthAnalysis(posts);
  const weeklyFrequency = computeWeeklyFrequency(posts, tz);
  const consistency = computePostingConsistency(posts, since, until, tz);
  const replyRateLeaders = computeReplyRateLeaders(posts);
  const topByEngRate = computeTopPostsByEngagementRate(posts);
  const shareLeaders = computeShareLeaders(posts);
  const textFeatureComparison = computeTextFeatureComparison(posts);
  const postingGapAnalysis = computePostingGapAnalysis(posts, tz);
  // Posting activity covers the account's full history, independent of the selected range
  const postingCalendar = computePostingCalendar(
    allPostTimestamps,
    allPostTimestamps[0]?.timestamp ?? since,
    new Date(),
    undefined,
    tz,
  );
  const contentFormatLengthMatrix = computeContentFormatLengthMatrix(posts);
  const sharesTrend = computeSharesTrend(posts, tz);
  const engagementBreakdownPie = computeEngagementBreakdownPie(posts);
  const keywordAnalysis = computeKeywordAnalysis(posts);
  const optimalFrequency = computeOptimalFrequency(posts, tz);
  const contentTypeTimeSlot = computeContentTypeTimeSlot(posts, tz);
  const postingStreak = computePostingStreak(posts, tz);

  // Audience metrics
  const followerTrend = computeFollowerTrend(followerSnapshots);
  const followerGrowth = summarizeFollowerGrowth(followerTrend);
  // Prefer the range's own snapshots so the headline figures and the comparison
  // describe the same two dates; fall back to the last capture of any date when
  // the range contains none.
  const currentDemographicSnapshot =
    windowDemographicSnapshots[windowDemographicSnapshots.length - 1] ?? null;
  const baselineDemographicSnapshot =
    windowDemographicSnapshots.length >= 2 ? (windowDemographicSnapshots[0] ?? null) : null;
  const demographics = parseDemographics(currentDemographicSnapshot?.demographics);
  const baselineDemographics = parseDemographics(baselineDemographicSnapshot?.demographics);
  // Distinguishes the three reasons demographics can be missing: no snapshot at
  // all, a snapshot from a profile under the API's threshold, or a snapshot
  // whose demographics fetch hasn't landed yet.
  const demographicsEmptyMessage = !latestSnapshot
    ? t.analytics.followerEmpty
    : latestSnapshot.followersCount < DEMOGRAPHICS_MIN_FOLLOWERS
      ? t.analytics.demographicsEmpty
      : t.analytics.demographicsPending;
  const demographicSlices = DEMOGRAPHIC_BREAKDOWNS.reduce(
    (acc, breakdown) => {
      acc[breakdown] = demographics
        ? compareDemographics(demographics[breakdown], baselineDemographics?.[breakdown] ?? null)
        : [];
      return acc;
    },
    {} as Record<DemographicBreakdown, DemographicSlice[]>,
  );
  const demographicTrends = DEMOGRAPHIC_BREAKDOWNS.reduce(
    (acc, breakdown) => {
      acc[breakdown] = computeDemographicTrend(windowDemographicSnapshots, breakdown);
      return acc;
    },
    {} as Record<DemographicBreakdown, DemographicTrendResult>,
  );
  const hasDemographicTrend = DEMOGRAPHIC_BREAKDOWNS.some(
    (breakdown) => demographicTrends[breakdown].keys.length > 0,
  );
  // Country names come from Intl.DisplayNames, whose ICU data differs between
  // Node and the browser, so they are resolved here and passed down as strings.
  const demographicKeyLabels = DEMOGRAPHIC_BREAKDOWNS.reduce(
    (acc, breakdown) => {
      const keys = [
        ...demographicSlices[breakdown].map((slice) => slice.key),
        ...demographicTrends[breakdown].keys,
      ];
      acc[breakdown] = buildDemographicLabels(keys, breakdown, locale, t.chart.genderLabels);
      return acc;
    },
    {} as Record<DemographicBreakdown, Record<string, string>>,
  );

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
            timeZone={tz}
            labels={t.sync}
            dateLocale={dateLocale}
          />
        </div>
      </div>

      <AnalyticsTabs defaultTab={activeTab}>
        {/* Pill segmented control, matching the granularity toggle grammar */}
        <TabsList className="bg-muted/70 rounded-full p-0.5">
          <TabsTrigger value="performance" className="rounded-full px-3">
            {t.analytics.performance}
          </TabsTrigger>
          <TabsTrigger value="content" className="rounded-full px-3">
            {t.analytics.content}
          </TabsTrigger>
          <TabsTrigger value="audience" className="rounded-full px-3">
            {t.analytics.audience}
          </TabsTrigger>
        </TabsList>

        {/* ── PERFORMANCE TAB ── */}
        <TabsContent value="performance" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard title={t.analytics.totalViews} value={totalViews} />
            <StatCard title={t.analytics.avgViewsDay} value={avgViewsPerDay} />
            <StatCard title={t.analytics.engRate} value={`${engRate}%`} />
            <StatCard title={t.analytics.shareRate} value={`${shareRate}%`} />
          </div>

          <ChartCard
            title={t.analytics.overallPerformance}
            subtitle={t.analytics.overallPerformanceSub}
            labels={cardLabels}
          >
            <OverallPerformanceChart
              data={dailyPerformance}
              dateLocale={dateLocale}
              timeZone={tz}
              labels={t.chart}
            />
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <ChartCard
              className="lg:col-span-3"
              title={t.analytics.viewsTrend}
              subtitle={t.analytics.viewsTrendSub}
              labels={cardLabels}
            >
              <ViewsTrendChart
                data={viewsTrend}
                dateLocale={dateLocale}
                labels={{
                  posts: t.chart.posts,
                  medianViews: t.chart.medianViews,
                  avgViews: t.chart.avgViews,
                  p75Views: t.chart.p75Views,
                  week: t.chart.week,
                  month: t.chart.month,
                  noData: t.chart.noData,
                }}
              />
            </ChartCard>

            <ChartCard
              className="lg:col-span-2"
              title={t.analytics.viewsDistribution}
              subtitle={t.analytics.viewsDistributionSub}
              labels={cardLabels}
            >
              <ViewsDistributionChart
                data={viewsDistribution}
                numberLocale={dateLocale}
                labels={{
                  views: t.chart.views,
                  posts: t.chart.posts,
                  viewRange: t.chart.viewRange,
                  ofPosts: t.chart.ofPosts,
                  noData: t.chart.noData,
                }}
              />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <ChartCard
              className="lg:col-span-3"
              title={t.analytics.postQuality}
              subtitle={t.analytics.postQualitySub}
              labels={cardLabels}
            >
              <PostQualityScatterChart data={postQualityScatter} labels={t.chart} />
            </ChartCard>

            <ChartCard
              className="lg:col-span-2"
              title={t.analytics.actionFunnel}
              subtitle={t.analytics.actionFunnelSub}
              labels={cardLabels}
            >
              <ActionFunnelChart data={actionFunnel} labels={t.chart} />
            </ChartCard>
          </div>

          <ChartCard
            title={t.analytics.engagementTrend}
            subtitle={t.analytics.engagementTrendSub}
            labels={cardLabels}
          >
            <EngagementRateChart
              data={engagementRateTrend}
              dateLocale={dateLocale}
              timeZone={tz}
              labels={t.chart}
            />
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title={t.analytics.bestTime}
              subtitle={t.analytics.bestTimeSub}
              labels={cardLabels}
            >
              <HourlyBreakdownChart
                heatmap={heatmap}
                bestTimeToPost={bestTimeToPost}
                dateLocale={dateLocale}
                labels={t.chart}
              />
            </ChartCard>

            <ChartCard
              title={t.analytics.bestDay}
              subtitle={t.analytics.bestDaySub}
              labels={cardLabels}
            >
              <DayOfWeekChart data={dayOfWeek} labels={t.chart} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <ChartCard
              className="lg:col-span-3"
              title={t.analytics.formatLengthMatrix}
              subtitle={t.analytics.formatLengthMatrixSub}
              labels={cardLabels}
            >
              <ContentFormatLengthMatrix
                data={contentFormatLengthMatrix}
                numberLocale={dateLocale}
                labels={t.chart}
              />
            </ChartCard>

            <ChartCard
              className="lg:col-span-2"
              title={t.analytics.engagementBreakdownPie}
              subtitle={t.analytics.engagementBreakdownPieSub}
              labels={cardLabels}
            >
              <EngagementBreakdownPieChart data={engagementBreakdownPie} labels={t.chart} />
            </ChartCard>
          </div>

          <ChartCard
            title={t.analytics.engagementBreakdown}
            subtitle={t.analytics.engagementBreakdownSub}
            labels={cardLabels}
          >
            <EngagementBreakdownChart
              data={engagementBreakdown}
              dateLocale={dateLocale}
              timeZone={tz}
              labels={t.chart}
            />
          </ChartCard>
        </TabsContent>

        {/* ── CONTENT TAB ── */}
        <TabsContent value="content" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
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
                <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
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
                <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
                  {t.analytics.quoteRatio}
                </p>
                <p className="mt-1 text-2xl font-semibold">{quoteToRepostRatio}%</p>
                <p className="text-muted-foreground mt-0.5 text-xs">{t.analytics.quoteRatioSub}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
                  {t.analytics.totalPosts}
                </p>
                <p className="mt-1 text-2xl font-semibold">{posts.length.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
                  {t.analytics.longestStreak}
                </p>
                <p className="mt-1 text-2xl font-semibold">{postingStreak.longestStreak}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">{t.analytics.days}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
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
            <ChartCard
              title={t.analytics.contentTypePerformance}
              subtitle={t.analytics.contentTypePerformanceSub}
              labels={cardLabels}
            >
              <ContentTypeChart data={contentTypeAnalysis} labels={t.chart} />
            </ChartCard>

            <ChartCard
              title={t.analytics.postLengthAnalysis}
              subtitle={
                <>
                  <span className="block">{t.analytics.postLengthAnalysisSub}</span>
                  <span className="block">{t.analytics.postLengthAnalysisSub2}</span>
                </>
              }
              labels={cardLabels}
            >
              <PostLengthChart data={postLengthAnalysis} labels={t.chart} />
            </ChartCard>
          </div>

          <ChartCard
            title={t.analytics.publishingFrequency}
            subtitle={t.analytics.publishingFrequencySub}
            labels={cardLabels}
          >
            <WeeklyFrequencyChart data={weeklyFrequency} labels={t.chart} />
          </ChartCard>

          <ChartCard
            title={t.analytics.sharesTrend}
            subtitle={t.analytics.sharesTrendSub}
            labels={cardLabels}
          >
            <SharesTrendChart
              data={sharesTrend}
              dateLocale={dateLocale}
              timeZone={tz}
              labels={{
                date: t.chart.date,
                shares: t.chart.shares,
                empty: t.analytics.sharesTrendEmpty,
                granularityDay: t.chart.granularityDay,
                granularityWeek: t.chart.granularityWeek,
                granularityMonth: t.chart.granularityMonth,
              }}
            />
          </ChartCard>

          <ChartCard
            title={t.analytics.keywordAnalysis}
            subtitle={t.analytics.keywordAnalysisSub}
            labels={cardLabels}
          >
            <KeywordAnalysisChart
              data={keywordAnalysis}
              labels={{
                posts: t.chart.posts,
                avgViews: t.chart.avgViews,
                engagementRate: t.chart.engagementRate,
                shareRate: t.chart.shareRate,
              }}
            />
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title={t.analytics.optimalFrequency}
              subtitle={t.analytics.optimalFrequencySub}
              labels={cardLabels}
            >
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
            </ChartCard>

            <ChartCard
              title={t.analytics.postingGap}
              subtitle={t.analytics.postingGapSub}
              labels={cardLabels}
            >
              <PostingGapChart
                data={postingGapAnalysis}
                labels={{
                  gapDays: t.chart.gapDays,
                  gapBuckets: t.chart.gapBuckets,
                  posts: t.chart.posts,
                  medianViews: t.chart.medianViews,
                  avgViews: t.chart.avgViews,
                  engagementRate: t.chart.engagementRate,
                  hitRate: t.chart.hitRate,
                  confidence: t.chart.confidence,
                  confidenceLevels: t.chart.confidenceLevels,
                  noData: t.chart.noData,
                }}
              />
            </ChartCard>
          </div>

          <ChartCard
            title={t.analytics.contentTypeTimeSlot}
            subtitle={t.analytics.contentTypeTimeSlotSub}
            labels={cardLabels}
          >
            <ContentTypeTimeSlotChart
              data={contentTypeTimeSlot}
              dateLocale={dateLocale}
              labels={t.chart}
            />
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Top by Engagement Rate */}
            {topByEngRate.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
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
                          <span
                            className="text-xs font-medium"
                            style={{ color: chartColors.engagement }}
                          >
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
                <CardHeader>
                  <CardTitle className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
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
                          <span
                            className="text-xs font-medium"
                            style={{ color: chartColors.reply }}
                          >
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

            {/* Share-Rate Leaders */}
            {shareLeaders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
                    {t.analytics.shareLeaders}
                  </CardTitle>
                  <p className="text-muted-foreground text-xs">{t.analytics.shareLeadersSub}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {shareLeaders.map((post, i) => (
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
                          <span
                            className="text-xs font-medium"
                            style={{ color: chartColors.share }}
                          >
                            {post.shareRate}% {t.analytics.shareRateInline}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {post.shares} {t.common.shares} · {post.views.toLocaleString()}{" "}
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

            {/* Content Feature Comparison */}
            <ChartCard
              title={t.analytics.textFeatures}
              subtitle={t.analytics.textFeaturesSub}
              labels={cardLabels}
            >
              <TextFeatureComparison
                data={textFeatureComparison}
                numberLocale={dateLocale}
                labels={{
                  withLink: t.chart.withLink,
                  withoutLink: t.chart.withoutLink,
                  withQuestion: t.chart.withQuestion,
                  withoutQuestion: t.chart.withoutQuestion,
                  medianViews: t.chart.medianViews,
                  engagementRate: t.chart.engagementRate,
                  replyRate: t.chart.replyRate,
                  posts: t.chart.posts,
                  noData: t.chart.noData,
                }}
              />
            </ChartCard>
          </div>
        </TabsContent>

        {/* ── AUDIENCE TAB ── */}
        <TabsContent value="audience" className="mt-4 space-y-4">
          {followerGrowth ? (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard title={t.analytics.followers} value={followerGrowth.current} />
                <StatCard
                  title={t.analytics.followerNet}
                  value={`${followerGrowth.net > 0 ? "+" : ""}${followerGrowth.net.toLocaleString(dateLocale)}`}
                  delta={followerGrowth.netPct}
                  deltaLabel={t.analytics.followerNetSub}
                />
                <StatCard
                  title={t.analytics.followerAvgPerDay}
                  value={`${followerGrowth.avgPerDay > 0 ? "+" : ""}${followerGrowth.avgPerDay.toLocaleString(dateLocale)}`}
                />
                <StatCard title={t.analytics.followerTrackedDays} value={followerGrowth.days} />
              </div>

              <ChartCard
                title={t.analytics.followerTrend}
                subtitle={t.analytics.followerTrendSub}
                labels={cardLabels}
              >
                <FollowerTrendChart
                  data={followerTrend}
                  dateLocale={dateLocale}
                  timeZone={tz}
                  labels={{
                    followers: t.chart.followers,
                    dailyChange: t.chart.dailyChange,
                    date: t.chart.date,
                    noData: t.chart.noData,
                  }}
                />
              </ChartCard>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
                  {t.analytics.followerTrend}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartEmptyState label={t.analytics.followerEmpty} height={140} />
              </CardContent>
            </Card>
          )}

          {hasDemographicData(demographics) ? (
            <div className="space-y-3">
              {/* Left-aligned under the heading: the page header already carries a
                  right-aligned time-range control for a different scope, and two
                  right-aligned date controls read as one group. */}
              <div className="flex flex-col gap-2.5">
                <div>
                  <h2 className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
                    {t.analytics.demographics}
                  </h2>
                  <p className="text-muted-foreground text-xs">{t.analytics.demographicsSub}</p>
                </div>
                {demographicDateKeys.length > 1 && baselineDateKey && currentDateKey && (
                  <DemographicDatePicker
                    // Newest first: the recent end of the history is what gets
                    // picked, and it would otherwise sit at the bottom of a list
                    // that grows by a row a day.
                    options={[...demographicDates].reverse().map((snapshot) => ({
                      value: utcDateToKey(snapshot.date),
                      label: formatSnapshotDate(snapshot.date, dateLocale),
                    }))}
                    baseline={baselineDateKey}
                    current={currentDateKey}
                    labels={{
                      baseline: t.chart.baselineDate,
                      current: t.chart.compareDate,
                    }}
                  />
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {DEMOGRAPHIC_BREAKDOWNS.filter(
                  (breakdown) => demographicSlices[breakdown].length > 0,
                ).map((breakdown) => (
                  <ChartCard key={breakdown} title={t.chart[breakdown]} labels={cardLabels}>
                    <FollowerDemographicsChart
                      data={demographicSlices[breakdown]}
                      keyLabels={demographicKeyLabels[breakdown]}
                      dateLocale={dateLocale}
                      compareDates={
                        baselineDemographicSnapshot && currentDemographicSnapshot
                          ? {
                              from: formatSnapshotDate(
                                baselineDemographicSnapshot.date,
                                dateLocale,
                              ),
                              to: formatSnapshotDate(currentDemographicSnapshot.date, dateLocale),
                            }
                          : undefined
                      }
                      labels={{
                        noData: t.chart.noData,
                        pointSuffix: t.chart.pointSuffix,
                        baselineMarker: t.chart.baselineMarker,
                        compare: t.analytics.demographicsCompare,
                      }}
                    />
                  </ChartCard>
                ))}
              </div>

              {hasDemographicTrend && (
                <>
                  <div className="pt-2">
                    <h2 className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
                      {t.analytics.demographicsTrend}
                    </h2>
                    <p className="text-muted-foreground text-xs">
                      {t.analytics.demographicsTrendSub}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {DEMOGRAPHIC_BREAKDOWNS.filter(
                      (breakdown) => demographicTrends[breakdown].keys.length > 0,
                    ).map((breakdown) => (
                      <ChartCard key={breakdown} title={t.chart[breakdown]} labels={cardLabels}>
                        <DemographicTrendChart
                          keys={demographicTrends[breakdown].keys}
                          rows={demographicTrends[breakdown].rows}
                          keyLabels={demographicKeyLabels[breakdown]}
                          dateLocale={dateLocale}
                          timeZone={tz}
                          labels={{
                            date: t.chart.date,
                            shareChange: t.chart.shareChange,
                            noData: t.chart.noData,
                            pointSuffix: t.chart.pointSuffix,
                            baseline: t.chart.baselineDate,
                          }}
                        />
                      </ChartCard>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <ChartCard
              title={t.analytics.demographics}
              subtitle={t.analytics.demographicsSub}
              labels={cardLabels}
            >
              <ChartEmptyState label={demographicsEmptyMessage} height={140} />
            </ChartCard>
          )}
        </TabsContent>
      </AnalyticsTabs>
    </div>
  );
}
