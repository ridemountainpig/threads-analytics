import { db } from "@/lib/db";
import { decryptToken } from "@/lib/crypto";
import { getUserInsights } from "@/lib/threads-api";
import type { UserInsights } from "@/lib/threads-api";
import { getTimeRange, toUnix } from "@/lib/time-range";
import { resolveRangeParams } from "@/lib/time-range-server";
import { getActiveAccount, getSyncIntervalCached } from "@/lib/dashboard-data";
import {
  computeBestTimeToPost,
  computeTopHours,
  computeViralPosts,
  type PostWithInsights,
} from "@/lib/analytics";
import { StatCard } from "@/components/dashboard/stat-card";
import { NoAccountNotice } from "@/components/dashboard/no-account-notice";
import { FirstSyncNotice } from "@/components/dashboard/first-sync-notice";
import SyncButton from "@/components/dashboard/sync-button";
import TimeRangePicker from "@/components/dashboard/time-range-picker";
import DailyViewsChart from "@/components/charts/daily-views-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ExternalLink } from "lucide-react";
import { dateLocales, getDictionary } from "@/lib/i18n-server";
import { getServerTimezone } from "@/lib/server-timezone";

interface PageProps {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}

function formatHour(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
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

  if (!account) {
    return (
      <NoAccountNotice
        message={t.common.noAccount}
        help={t.common.noAccountHelp}
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

  const shouldFetchUserInsights = range !== "all";
  const userInsightsPromise = shouldFetchUserInsights
    ? getUserInsights(account.id, accessToken, toUnix(since), toUnix(until)).catch(
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
    ? getUserInsights(account.id, accessToken, toUnix(prevSince), toUnix(prevUntil)).catch(
        () => emptyUserInsights,
      )
    : Promise.resolve(emptyUserInsights);

  const [userInsights, prevUserInsights, dbPosts, prevDbPosts, syncInterval] = await Promise.all([
    userInsightsPromise,
    prevUserInsightsPromise,
    db.post.findMany({
      where: {
        accountId: account.id,
        timestamp: { gte: since, lte: until },
        mediaType: { not: "REPOST_FACADE" },
      },
      orderBy: { timestamp: "desc" },
      take: 2000,
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
  const dailyViewsData = hasApiInsights
    ? userInsights.views
    : Array.from(
        posts.reduce((map, p) => {
          const date = new Date(p.timestamp).toISOString().slice(0, 10);
          map.set(date, (map.get(date) ?? 0) + p.views);
          return map;
        }, new Map<string, number>()),
      )
        .map(([end_time, value]) => ({ end_time, value }))
        .sort((a, b) => a.end_time.localeCompare(b.end_time));

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

  const deltaViews = pctChange(curViews, prevViews);
  const deltaLikes = pctChange(curLikes, prevLikes);
  const deltaReplies = pctChange(curReplies, prevReplies);
  const deltaReposts = pctChange(curReposts, prevReposts);
  const deltaQuotes = pctChange(curQuotes, prevQuotes);
  const deltaShares = pctChange(curShares, prevShares);
  const deltaEngRate = pctChange(curEng, prevEng);
  const viralPosts = computeViralPosts(posts);
  const bestTimeToPost = computeBestTimeToPost(posts, tz);
  const topHours = computeTopHours(bestTimeToPost);
  const topHourDetails = topHours
    .map((hour) => bestTimeToPost.find((point) => point.hour === hour))
    .filter((point) => point !== undefined);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.overview.title}</h1>
          <p className="text-muted-foreground text-sm">{t.overview.subtitle}</p>
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

      {/* Top Hour Recommendation */}
      {topHours.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="text-primary size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">{t.overview.bestHours}</p>
              <p className="text-muted-foreground text-sm">
                {topHourDetails
                  .map(
                    (point) =>
                      `${formatHour(point.hour)} (${point.postCount} ${t.common.posts}, ${getConfidenceLabel(
                        point.confidence,
                        t.chart.confidenceLevels,
                      )})`,
                  )
                  .join(", ")}{" "}
                - {t.overview.bestHoursSub}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <StatCard
          title={t.overview.totalViews}
          value={totalViews}
          delta={deltaViews}
          deltaLabel={t.overview.vsPrev}
        />
        <StatCard
          title={t.overview.likes}
          value={totalLikes}
          delta={deltaLikes}
          deltaLabel={t.overview.vsPrev}
        />
        <StatCard
          title={t.overview.replies}
          value={totalReplies}
          delta={deltaReplies}
          deltaLabel={t.overview.vsPrev}
        />
        <StatCard
          title={t.overview.reposts}
          value={totalReposts}
          delta={deltaReposts}
          deltaLabel={t.overview.vsPrev}
        />
        <StatCard
          title={t.overview.quotes}
          value={totalQuotes}
          delta={deltaQuotes}
          deltaLabel={t.overview.vsPrev}
        />
        <StatCard
          title={t.overview.shares}
          value={totalShares}
          delta={deltaShares}
          deltaLabel={t.overview.vsPrev}
        />
        <StatCard
          title={t.overview.engRate}
          value={`${engagementRate.toFixed(2)}%`}
          delta={deltaEngRate}
          deltaLabel={t.overview.vsPrev}
        />
      </div>

      {/* Daily Views */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
            {t.overview.dailyViews}
          </CardTitle>
          <p className="text-muted-foreground text-xs">{t.overview.dailyViewsSub}</p>
        </CardHeader>
        <CardContent>
          <DailyViewsChart data={dailyViewsData} dateLocale={dateLocale} labels={t.chart} />
        </CardContent>
      </Card>

      {/* Viral Posts */}
      {viralPosts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
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
                    <span className="text-primary text-sm font-medium">
                      {post.multiplier}x {t.overview.median}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {new Date(post.timestamp).toLocaleDateString(dateLocale)}
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
  );
}
