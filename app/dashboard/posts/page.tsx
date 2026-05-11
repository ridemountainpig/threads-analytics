import { db } from "@/lib/db";
import { getTimeRange } from "@/lib/time-range";
import { getActiveAccount, getSyncIntervalCached } from "@/lib/dashboard-data";
import Link from "next/link";
import TimeRangePicker from "@/components/dashboard/time-range-picker";
import SyncButton from "@/components/dashboard/sync-button";
import PostList from "./post-list";
import { dateLocales, getDictionary } from "@/lib/i18n-server";
import { getServerTimezone } from "@/lib/server-timezone";

interface PageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    sort?: string;
    page?: string;
  }>;
}

const POSTS_PER_PAGE = 50;

export default async function PostsPage({ searchParams }: PageProps) {
  const { range, from, to, sort = "date", page } = await searchParams;
  const [{ locale, t }, account, syncInterval, tz] = await Promise.all([
    getDictionary(),
    getActiveAccount(),
    getSyncIntervalCached(),
    getServerTimezone(),
  ]);
  const { since, until } = getTimeRange({ range, from, to }, tz);
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

  const where = {
    accountId: account.id,
    timestamp: { gte: since, lte: until },
    mediaType: { not: "REPOST_FACADE" },
  };
  const totalPosts = await db.post.count({ where });
  const pageCount = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE));
  const requestedPage = Number.parseInt(page ?? "1", 10);
  const currentPage =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, pageCount)
      : 1;

  const [posts, allViewsRows] = await Promise.all([
    db.post.findMany({
      where,
      orderBy,
      skip: (currentPage - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    db.post.findMany({ where, select: { views: true } }),
  ]);

  const sortedViews = allViewsRows.map((p) => p.views).sort((a, b) => a - b);
  const positiveViews = sortedViews.filter((v) => v > 0);
  const medianViews =
    positiveViews.length === 0 ? 0 : (positiveViews[Math.floor(positiveViews.length / 2)] ?? 0);

  function viewPercentile(views: number): number {
    if (sortedViews.length === 0) return 0;
    // cume_dist: share of posts with views <= this one's
    let lo = 0;
    let hi = sortedViews.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if ((sortedViews[mid] ?? 0) <= views) lo = mid + 1;
      else hi = mid;
    }
    return Math.round((lo / sortedViews.length) * 100);
  }

  const postsWithBenchmarks = posts.map((post) => ({
    ...post,
    viewsVsMedian: medianViews > 0 ? Math.round((post.views / medianViews) * 10) / 10 : 0,
    viewPercentile: viewPercentile(post.views),
  }));

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (range) params.set("range", range);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (sort && sort !== "date") params.set("sort", sort);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return query ? `/dashboard/posts?${query}` : "/dashboard/posts";
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.postsPage.title}</h1>
          <p className="text-muted-foreground text-sm">
            {totalPosts} {t.common.posts}
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
        hasPagination={totalPosts > POSTS_PER_PAGE}
        labels={t.postsPage}
        dateLocale={dateLocale}
      />
      {totalPosts > POSTS_PER_PAGE && (
        <div className="flex items-center justify-between gap-3">
          {currentPage > 1 ? (
            <Link
              href={pageHref(currentPage - 1)}
              className="border-input bg-background hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
            >
              {t.postsPage.previousPage}
            </Link>
          ) : (
            <span className="text-muted-foreground border-input rounded-md border px-3 py-1.5 text-sm opacity-50">
              {t.postsPage.previousPage}
            </span>
          )}
          <span className="text-muted-foreground text-sm">
            {t.postsPage.pageStatus
              .replace("{page}", String(currentPage))
              .replace("{total}", String(pageCount))}
          </span>
          {currentPage < pageCount ? (
            <Link
              href={pageHref(currentPage + 1)}
              className="border-input bg-background hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
            >
              {t.postsPage.nextPage}
            </Link>
          ) : (
            <span className="text-muted-foreground border-input rounded-md border px-3 py-1.5 text-sm opacity-50">
              {t.postsPage.nextPage}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
