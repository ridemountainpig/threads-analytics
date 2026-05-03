import { db } from "@/lib/db";
import { getTimeRange } from "@/lib/time-range";
import { getActiveAccount, getSyncIntervalCached } from "@/lib/dashboard-data";
import TimeRangePicker from "@/components/dashboard/time-range-picker";
import SyncButton from "@/components/dashboard/sync-button";
import PostList from "./post-list";
import { dateLocales, getDictionary } from "@/lib/i18n-server";

interface PageProps {
  searchParams: Promise<{ range?: string; from?: string; to?: string; sort?: string }>;
}

function getMedian(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
  return sorted[mid] ?? 0;
}

export default async function PostsPage({ searchParams }: PageProps) {
  const { range, from, to, sort = "date" } = await searchParams;
  const { since, until } = getTimeRange({ range, from, to });
  const [{ locale, t }, account, syncInterval] = await Promise.all([
    getDictionary(),
    getActiveAccount(),
    getSyncIntervalCached(),
  ]);
  const dateLocale = dateLocales[locale];

  if (!account) {
    return <div className="text-muted-foreground p-8">{t.common.noAccount}</div>;
  }

  const orderBy =
    sort === "views"
      ? { views: "desc" as const }
      : sort === "likes"
        ? { likes: "desc" as const }
        : { timestamp: "desc" as const };

  const posts = await db.post.findMany({
    where: {
      accountId: account.id,
      timestamp: { gte: since, lte: until },
      mediaType: { not: "REPOST_FACADE" },
    },
    orderBy,
  });

  const sortedViews = posts.map((post) => post.views).sort((a, b) => a - b);
  const medianViews = getMedian(sortedViews.filter((views) => views > 0));
  const percentileByViews = new Map<number, number>();
  for (let i = 0; i < sortedViews.length; i++) {
    percentileByViews.set(sortedViews[i] ?? 0, Math.round(((i + 1) / sortedViews.length) * 100));
  }
  const postsWithBenchmarks = posts.map((post) => ({
    ...post,
    viewsVsMedian: medianViews > 0 ? Math.round((post.views / medianViews) * 10) / 10 : 0,
    viewPercentile: percentileByViews.get(post.views) ?? 0,
  }));

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.postsPage.title}</h1>
          <p className="text-muted-foreground text-sm">
            {posts.length} {t.common.posts}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:items-end lg:w-auto lg:flex-row lg:items-start lg:gap-4">
          <TimeRangePicker locale={locale} labels={t.timeRange} />
          <SyncButton
            lastSyncedAt={account.syncState?.lastSyncedAt?.toISOString()}
            syncInterval={syncInterval}
            labels={t.sync}
            dateLocale={dateLocale}
          />
        </div>
      </div>
      <PostList
        posts={postsWithBenchmarks}
        medianViews={medianViews}
        currentSort={sort}
        labels={t.postsPage}
        dateLocale={dateLocale}
      />
    </div>
  );
}
