import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma";
import { decryptToken } from "@/lib/crypto";
import { getUserInsightsCached } from "@/lib/user-insights-cache";
import type { UserInsights } from "@/lib/threads-api";
import { getTimeRange, toUnix } from "@/lib/time-range";
import { resolveRangeParams } from "@/lib/time-range-server";
import {
  DASHBOARD_POST_LIMIT,
  getActiveAccount,
  getSyncIntervalCached,
} from "@/lib/dashboard-data";
import { getTodayBounds } from "@/lib/today-data";
import {
  computeBestTimeToPost,
  computeTopHours,
  getSettledBaselineMedianViews,
  computeViralPosts,
  getBaselineMedianViews,
  getDateString,
  type PostWithInsights,
} from "@/lib/analytics";
import {
  computeFollowerRangeTrend,
  dateKeyToUtcDate,
  followerQueryStart,
  parseDemographics,
  snapshotDays,
  summarizeFollowerGrowth,
} from "@/lib/followers";
import { formatDemographicKey } from "@/lib/demographic-labels";
import { buildSummary } from "@/lib/summary";
import { bucketSeries, listDays, medianSeries, ratioSeries, smoothSeries } from "@/lib/sparkline";
import { StatCard } from "@/components/dashboard/stat-card";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { NoAccountNotice } from "@/components/dashboard/no-account-notice";
import { TokenExpiredNotice } from "@/components/dashboard/token-expired-notice";
import { FirstSyncNotice } from "@/components/dashboard/first-sync-notice";
import PageHeader from "@/components/dashboard/page-header";
import DailyViewsChart from "@/components/charts/daily-views-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { dateLocales, getDictionary } from "@/lib/i18n-server";
import { getServerTimezone } from "@/lib/server-timezone";
import { hourLabeler } from "@/lib/hour-label";

interface PageProps {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}

function formatDate(date: string, dateLocale: string, timeZone: string) {
  return new Intl.DateTimeFormat(dateLocale, {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(date));
}

function getConfidenceLabel(
  confidence: "low" | "medium" | "high",
  labels?: Record<"low" | "medium" | "high", string>,
) {
  return labels?.[confidence] ?? confidence;
}

export default async function OverviewPage({ searchParams }: PageProps) {
  const { range: rangeParam, from: fromParam, to: toParam } = await searchParams;
  const [{ locale, t }, account, tz, resolved] = await Promise.all([
    getDictionary(),
    getActiveAccount(),
    getServerTimezone(),
    resolveRangeParams({ range: rangeParam, from: fromParam, to: toParam }),
  ]);
  const { range, from, to } = resolved;
  const { since, until } = getTimeRange({ range, from, to }, tz);
  const dateLocale = dateLocales[locale];
  const hourLabel = hourLabeler(dateLocale);

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
      <TokenExpiredNotice
        message={t.common.credentialsUnavailable}
        help={t.common.tokenExpiredHelp}
        settingsLabel={t.common.settings}
      />
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
  const userInsightsPromise = shouldFetchUserInsights
    ? getUserInsightsCached(account.id, accessToken, toUnix(since), toUnix(until)).catch(
        () => emptyUserInsights,
      )
    : Promise.resolve(emptyUserInsights);

  const showComparison = range !== "all";
  const rangeMs = until.getTime() - since.getTime();
  const prevUntil = new Date(since.getTime());
  const prevSince = new Date(since.getTime() - rangeMs);

  // Fetch the previous period's profile insights too, so the engagement-rate
  // delta can be measured on the same profile-view denominator as the headline
  // rate rather than mixing it with post-view based numbers.
  const prevUserInsightsPromise = showComparison
    ? getUserInsightsCached(account.id, accessToken, toUnix(prevSince), toUnix(prevUntil)).catch(
        () => emptyUserInsights,
      )
    : Promise.resolve(emptyUserInsights);

  // Snapshot dates are bucketed by DEFAULT_TZ, the zone captureFollowerSnapshot
  // writes them in, so the range edges are reduced the same way.
  const { firstKey: sinceKey, lastKey: untilKey } = snapshotDays({ since, until });

  const [
    userInsights,
    prevUserInsights,
    dbPosts,
    prevDbPosts,
    syncInterval,
    followerSnapshots,
    latestDemographics,
    postsToday,
    firstPost,
  ] = await Promise.all([
    userInsightsPromise,
    prevUserInsightsPromise,
    db.post.findMany({
      where: {
        accountId: account.id,
        timestamp: { gte: since, lte: until },
        mediaType: { not: "REPOST_FACADE" },
      },
      orderBy: { timestamp: "desc" },
      take: DASHBOARD_POST_LIMIT,
    }),
    showComparison
      ? db.post.findMany({
          where: {
            accountId: account.id,
            timestamp: { gte: prevSince, lt: prevUntil },
            mediaType: { not: "REPOST_FACADE" },
          },
          select: {
            views: true,
            likes: true,
            replies: true,
            reposts: true,
            quotes: true,
            shares: true,
          },
        })
      : Promise.resolve([]),
    getSyncIntervalCached(),
    db.followerSnapshot.findMany({
      where: {
        accountId: account.id,
        date: { gte: followerQueryStart(sinceKey), lte: dateKeyToUtcDate(untilKey) },
      },
      select: { date: true, followersCount: true },
      orderBy: { date: "asc" },
    }),
    db.followerSnapshot.findFirst({
      where: { accountId: account.id, demographics: { not: Prisma.DbNull } },
      select: { demographics: true },
      orderBy: { date: "desc" },
    }),
    db.post.count({
      where: {
        accountId: account.id,
        timestamp: { gte: getTodayBounds(tz).todayStart },
        mediaType: { not: "REPOST_FACADE" },
      },
    }),
    range === "all"
      ? db.post.findFirst({
          where: { accountId: account.id, mediaType: { not: "REPOST_FACADE" } },
          select: { timestamp: true },
          orderBy: { timestamp: "asc" },
        })
      : Promise.resolve(null),
  ]);

  const postCapReached = dbPosts.length >= DASHBOARD_POST_LIMIT;
  // "All" starts at a fixed 2020 date and a capped load stops at its oldest post,
  // so series count from the first post actually loaded.
  const seriesStart = postCapReached
    ? dbPosts[dbPosts.length - 1]?.timestamp
    : firstPost?.timestamp;
  const seriesSince = seriesStart && seriesStart > since ? seriesStart : since;

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
    syncedAt: p.syncedAt,
  }));

  // Period-over-period deltas (computed from DB data for consistency)
  function pctChange(cur: number, prev: number): number | null {
    if (!showComparison || prev === 0) return null;
    return Math.round(((cur - prev) / prev) * 1000) / 10;
  }

  const curViews = dbPosts.reduce((s, p) => s + p.views, 0);
  const curLikes = dbPosts.reduce((s, p) => s + p.likes, 0);
  const curReplies = dbPosts.reduce((s, p) => s + p.replies, 0);
  const curReposts = dbPosts.reduce((s, p) => s + p.reposts, 0);
  const curQuotes = dbPosts.reduce((s, p) => s + p.quotes, 0);
  const curShares = dbPosts.reduce((s, p) => s + p.shares, 0);
  const hasApiInsights = userInsights.views.length > 0;
  const totalViews = hasApiInsights
    ? userInsights.views.reduce((sum, d) => sum + d.value, 0)
    : curViews;
  const totalLikes = hasApiInsights ? userInsights.totalLikes : curLikes;
  const totalReplies = hasApiInsights ? userInsights.totalReplies : curReplies;
  const totalReposts = hasApiInsights ? userInsights.totalReposts : curReposts;
  const totalQuotes = hasApiInsights ? userInsights.totalQuotes : curQuotes;
  const totalShares = curShares;
  const totalEngagements = totalLikes + totalReplies + totalReposts + totalQuotes;
  const engagementRate = totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0;
  // Without account insights: post views by publish day, every calendar day listed.
  const postViewsByDay = posts.reduce((map, p) => {
    const date = getDateString(new Date(p.timestamp), tz);
    map.set(date, (map.get(date) ?? 0) + p.views);
    return map;
  }, new Map<string, number>());
  const dailyViewsData = hasApiInsights
    ? userInsights.views
    : listDays(seriesSince, until, tz).map((end_time) => ({
        end_time,
        value: postViewsByDay.get(end_time) ?? 0,
      }));

  const prevViews = prevDbPosts.reduce((s, p) => s + p.views, 0);
  const prevLikes = prevDbPosts.reduce((s, p) => s + p.likes, 0);
  const prevReplies = prevDbPosts.reduce((s, p) => s + p.replies, 0);
  const prevReposts = prevDbPosts.reduce((s, p) => s + p.reposts, 0);
  const prevQuotes = prevDbPosts.reduce((s, p) => s + p.quotes, 0);
  const prevShares = prevDbPosts.reduce((s, p) => s + p.shares, 0);

  // The engagement-rate delta compares both periods on one denominator: profile
  // views when BOTH periods have insights (matching the headline rate), else
  // post views for both. Never mix bases across the two periods.
  const prevHasApiInsights = prevUserInsights.views.length > 0;
  const useProfileForEngDelta = hasApiInsights && prevHasApiInsights;
  const engRateOf = (
    views: number,
    likes: number,
    replies: number,
    reposts: number,
    quotes: number,
  ) => (views > 0 ? ((likes + replies + reposts + quotes) / views) * 100 : 0);
  const curEng = useProfileForEngDelta
    ? engRateOf(
        userInsights.views.reduce((s, d) => s + d.value, 0),
        userInsights.totalLikes,
        userInsights.totalReplies,
        userInsights.totalReposts,
        userInsights.totalQuotes,
      )
    : engRateOf(curViews, curLikes, curReplies, curReposts, curQuotes);
  const prevEng = useProfileForEngDelta
    ? engRateOf(
        prevUserInsights.views.reduce((s, d) => s + d.value, 0),
        prevUserInsights.totalLikes,
        prevUserInsights.totalReplies,
        prevUserInsights.totalReposts,
        prevUserInsights.totalQuotes,
      )
    : engRateOf(prevViews, prevLikes, prevReplies, prevReposts, prevQuotes);

  const curMedianViews = getBaselineMedianViews(dbPosts);
  const prevMedianViews = getBaselineMedianViews(prevDbPosts);

  // Account totals when both periods have them, else post sums for both.
  const sumViews = (insights: UserInsights) => insights.views.reduce((s, d) => s + d.value, 0);
  const deltaViews = useProfileForEngDelta
    ? pctChange(sumViews(userInsights), sumViews(prevUserInsights))
    : pctChange(curViews, prevViews);
  const deltaLikes = useProfileForEngDelta
    ? pctChange(userInsights.totalLikes, prevUserInsights.totalLikes)
    : pctChange(curLikes, prevLikes);
  const deltaReplies = useProfileForEngDelta
    ? pctChange(userInsights.totalReplies, prevUserInsights.totalReplies)
    : pctChange(curReplies, prevReplies);
  const deltaRepostsQuotes = useProfileForEngDelta
    ? pctChange(
        userInsights.totalReposts + userInsights.totalQuotes,
        prevUserInsights.totalReposts + prevUserInsights.totalQuotes,
      )
    : pctChange(curReposts + curQuotes, prevReposts + prevQuotes);
  const deltaShares = pctChange(curShares, prevShares);
  const deltaEngRate = pctChange(curEng, prevEng);
  const deltaPosts = pctChange(dbPosts.length, prevDbPosts.length);
  const deltaMedianViews = pctChange(curMedianViews, prevMedianViews);
  const viralPosts = computeViralPosts(posts);
  const bestTimeToPost = computeBestTimeToPost(posts, tz);
  const topHours = computeTopHours(bestTimeToPost, getSettledBaselineMedianViews(posts));
  const topHourDetails = topHours
    .map((hour) => bestTimeToPost.find((point) => point.hour === hour))
    .filter((point) => point !== undefined);

  const followerRange = computeFollowerRangeTrend(followerSnapshots, sinceKey, untilKey);
  const followerGrowth = summarizeFollowerGrowth(followerRange.trend, followerRange.opening);
  const countryBreakdown = parseDemographics(latestDemographics?.demographics)?.country;
  const topCountryEntry = countryBreakdown?.entries.reduce<
    (typeof countryBreakdown.entries)[number] | null
  >((best, entry) => (best && best.value >= entry.value ? best : entry), null);
  const topCountry =
    topCountryEntry && countryBreakdown && countryBreakdown.total > 0
      ? {
          label: formatDemographicKey(topCountryEntry.key, "country", dateLocale),
          share: Math.round((topCountryEntry.value / countryBreakdown.total) * 1000) / 10,
        }
      : null;
  // Same encoding as the picker; a cookie-less first visit has no range at all.
  const rangeQuery = from && to ? `&from=${from}&to=${to}` : range ? `&range=${range}` : "";
  const summary = buildSummary(
    {
      totalViews,
      postCount: dbPosts.length,
      medianViews: curMedianViews,
      engagementRate,
      deltaViews,
      deltaEngRate,
      deltaPosts,
      // A single snapshot has no growth to report, only a count.
      followers:
        followerGrowth?.net != null
          ? { current: followerGrowth.current, net: followerGrowth.net }
          : null,
      topCountry,
      topPost: viralPosts[0]
        ? { text: viralPosts[0].text, multiplier: viralPosts[0].multiplier }
        : null,
    },
    t.overview,
    dateLocale,
  );

  // Sparklines: per-day (or per-week/month on long ranges) shape of each
  // headline metric. Post-level figures are bucketed by publish date.
  const smoothed = ({ values, granularity }: ReturnType<typeof bucketSeries>) =>
    smoothSeries(values, granularity);
  const spark = (pick: (p: (typeof dbPosts)[number]) => number) =>
    smoothed(
      bucketSeries(
        dbPosts.map((p) => ({ date: p.timestamp, value: pick(p) })),
        seriesSince,
        until,
        tz,
      ),
    );
  const trendViews = smoothed(
    bucketSeries(
      dailyViewsData.map((d) => ({ date: d.end_time, value: d.value })),
      seriesSince,
      until,
      tz,
    ),
  );
  const trendPosts = spark(() => 1);
  const trendMedianViews = medianSeries(
    dbPosts.map((p) => ({ date: p.timestamp, views: p.views })),
    seriesSince,
    until,
    tz,
  );
  const trendEngRate = ratioSeries(
    spark((p) => p.likes + p.replies + p.reposts + p.quotes),
    spark((p) => p.views),
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title={t.overview.title}
        subtitle={t.overview.subtitle}
        range={{
          locale,
          timeZone: tz,
          labels: t.timeRange,
          defaultRange: range,
          defaultFrom: from,
          defaultTo: to,
        }}
        sync={{
          lastSyncedAt: account.syncState?.lastSyncedAt?.toISOString(),
          syncInterval,
          timeZone: tz,
          labels: t.sync,
          dateLocale,
        }}
      />

      {postCapReached && (
        <p className="text-muted-foreground text-xs">
          {t.overview.postCapNotice.replace(
            "{count}",
            DASHBOARD_POST_LIMIT.toLocaleString(dateLocale),
          )}
        </p>
      )}

      {(dbPosts.length > 0 || hasApiInsights) && (
        <SummaryCard
          title={t.overview.summary}
          headline={summary[0] ?? ""}
          detail={summary.slice(1).join(t.overview.summarySeparator)}
          note={t.overview.summaryNote}
          bestHours={{
            title: t.overview.bestHours,
            sub: t.overview.bestHoursSub,
            postsLabel: t.common.posts,
            href: `/dashboard/analytics?tab=performance${rangeQuery}`,
            slots: topHourDetails.map((point) => ({
              label: hourLabel(point.hour),
              postCount: point.postCount,
              confidence: point.confidence,
              confidenceLabel: getConfidenceLabel(point.confidence, t.chart.confidenceLevels),
            })),
          }}
        />
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          title={t.overview.totalViews}
          trend={trendViews}
          value={totalViews}
          delta={deltaViews}
          deltaLabel={t.overview.vsPrev}
        />
        <StatCard
          title={t.overview.totalPosts}
          trend={trendPosts}
          value={dbPosts.length}
          delta={deltaPosts}
          deltaLabel={t.overview.vsPrev}
        />
        <StatCard
          title={t.overview.medianViews}
          trend={trendMedianViews}
          value={curMedianViews}
          delta={deltaMedianViews}
          deltaLabel={t.overview.vsPrev}
        />
        <StatCard
          title={t.overview.engRate}
          trend={trendEngRate}
          value={`${engagementRate.toFixed(2)}%`}
          delta={deltaEngRate}
          deltaLabel={t.overview.vsPrev}
        />
        <StatCard
          title={t.overview.likes}
          size="sm"
          value={totalLikes}
          delta={deltaLikes}
          deltaLabel={t.overview.vsPrev}
        />
        <StatCard
          title={t.overview.replies}
          size="sm"
          value={totalReplies}
          delta={deltaReplies}
          deltaLabel={t.overview.vsPrev}
        />
        <StatCard
          title={t.overview.repostsQuotes}
          size="sm"
          value={totalReposts + totalQuotes}
          delta={deltaRepostsQuotes}
          deltaLabel={t.overview.vsPrev}
        />
        <StatCard
          title={t.overview.shares}
          size="sm"
          value={totalShares}
          delta={deltaShares}
          deltaLabel={t.overview.vsPrev}
        />
      </div>

      {postsToday > 0 && (
        <Link
          href="/dashboard/today"
          className="bg-card ring-foreground/10 hover:bg-muted/40 group flex items-center gap-3 rounded-xl px-4 py-3 ring-1 transition-[background-color,scale] duration-150 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <span className="min-w-0 flex-1 text-sm">
            {postsToday === 1
              ? t.overview.todayLinkOne
              : t.overview.todayLinkOther.replace("{count}", postsToday.toLocaleString(dateLocale))}
          </span>
          <span className="text-tint flex shrink-0 items-center gap-0.5 text-sm font-medium">
            {t.overview.todayLinkCta}
            <ChevronRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
          </span>
        </Link>
      )}

      {/* Daily Views */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
            {t.overview.dailyViews}
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            {hasApiInsights ? t.overview.dailyViewsSub : t.overview.dailyViewsPostsSub}
          </p>
        </CardHeader>
        <CardContent>
          <DailyViewsChart
            data={dailyViewsData}
            dateLocale={dateLocale}
            timeZone={tz}
            labels={hasApiInsights ? t.chart : { ...t.chart, views: t.chart.postViewsByPublishDay }}
          />
        </CardContent>
      </Card>

      {/* Viral Posts */}
      {viralPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
              {t.overview.topPosts}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {viralPosts.map((post, i) => (
              <div key={post.id} className="flex items-start gap-3 border-b py-3 last:border-0">
                <span className="text-muted-foreground w-5 shrink-0 text-sm font-medium">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm">{post.text}</p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-muted-foreground text-sm">
                      {post.views.toLocaleString()} {t.common.views}
                    </span>
                    <span className="text-foreground text-sm font-medium">
                      {post.multiplier}x {t.overview.median}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {formatDate(post.timestamp, dateLocale, tz)}
                    </span>
                  </div>
                </div>
                {post.permalink && (
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.postsPage.viewOnThreads}
                    title={t.postsPage.viewOnThreads}
                    className="text-tint -m-3.5 shrink-0 p-3.5 transition-opacity duration-150 hover:opacity-80 active:opacity-60 motion-reduce:transition-none"
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
  );
}
