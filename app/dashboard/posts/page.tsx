import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma";
import { getPostBenchmarks } from "@/lib/post-benchmarks";
import { getTimeRange } from "@/lib/time-range";
import { resolveRangeParams } from "@/lib/time-range-server";
import { getActiveAccount, getSyncIntervalCached } from "@/lib/dashboard-data";
import Link from "next/link";
import { Download } from "lucide-react";
import TimeRangePicker from "@/components/dashboard/time-range-picker";
import SyncButton from "@/components/dashboard/sync-button";
import PostList from "./post-list";
import { NoAccountNotice } from "@/components/dashboard/no-account-notice";
import { TokenExpiredNotice } from "@/components/dashboard/token-expired-notice";
import { FirstSyncNotice } from "@/components/dashboard/first-sync-notice";
import { dateLocales, getDictionary } from "@/lib/i18n-server";
import { getServerTimezone } from "@/lib/server-timezone";

interface PageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    sort?: string;
    dir?: string;
    page?: string;
    q?: string;
    type?: string;
  }>;
}

const POSTS_PER_PAGE = 50;
const SORT_KEYS = ["date", "views", "likes", "replies", "shares", "engRate"] as const;
type SortKey = (typeof SORT_KEYS)[number];

export default async function PostsPage({ searchParams }: PageProps) {
  const {
    range: rangeParam,
    from: fromParam,
    to: toParam,
    sort: sortParam,
    dir: dirParam,
    page,
    q: qParam,
    type: typeParam,
  } = await searchParams;
  const sort: SortKey = (SORT_KEYS as readonly string[]).includes(sortParam ?? "")
    ? (sortParam as SortKey)
    : "date";
  const dir: "asc" | "desc" = dirParam === "asc" ? "asc" : "desc";
  const query = (qParam ?? "").trim();
  const mediaFilter = (typeParam ?? "").trim();
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

  // Benchmark population: every post in range (search/type filters must not move
  // the median the individual posts are compared against).
  const rangeWhere = {
    accountId: account.id,
    timestamp: { gte: since, lte: until },
    mediaType: { not: "REPOST_FACADE" },
  } as const;

  // The visible list, narrowed by the search box and media-type filter.
  const listWhere: Prisma.PostWhereInput = {
    ...rangeWhere,
    ...(query ? { text: { contains: query, mode: "insensitive" as const } } : {}),
    ...(mediaFilter && mediaFilter !== "REPOST_FACADE" ? { mediaType: mediaFilter } : {}),
  };

  const [totalPosts, availableTypeRows] = await Promise.all([
    db.post.count({ where: listWhere }),
    db.post.findMany({
      where: rangeWhere,
      select: { mediaType: true },
      distinct: ["mediaType"],
    }),
  ]);
  const availableTypes = availableTypeRows.map((r) => r.mediaType).sort();

  const pageCount = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE));
  const requestedPage = Number.parseInt(page ?? "1", 10);
  const currentPage =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, pageCount)
      : 1;
  const skip = (currentPage - 1) * POSTS_PER_PAGE;

  let posts: Awaited<ReturnType<typeof db.post.findMany>>;
  if (sort === "engRate") {
    // Engagement rate is computed, not a column, so order it in SQL and refetch
    // the rows by id (Prisma can't orderBy a derived expression).
    const conds: Prisma.Sql[] = [
      Prisma.sql`"accountId" = ${account.id}`,
      Prisma.sql`"timestamp" >= ${since}`,
      Prisma.sql`"timestamp" <= ${until}`,
      Prisma.sql`"mediaType" <> 'REPOST_FACADE'`,
    ];
    if (query) {
      const pattern = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      conds.push(Prisma.sql`"text" ILIKE ${pattern}`);
    }
    if (mediaFilter && mediaFilter !== "REPOST_FACADE") {
      conds.push(Prisma.sql`"mediaType" = ${mediaFilter}`);
    }
    const whereSql = Prisma.join(conds, " AND ");
    const dirSql = dir === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;
    const idRows = await db.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT id FROM "Post" WHERE ${whereSql}
      ORDER BY (likes + replies + reposts + quotes)::float / NULLIF(views, 0) ${dirSql} NULLS LAST,
        timestamp DESC
      LIMIT ${POSTS_PER_PAGE} OFFSET ${skip}`);
    const ids = idRows.map((r) => r.id);
    const rows = ids.length ? await db.post.findMany({ where: { id: { in: ids } } }) : [];
    const byId = new Map(rows.map((p) => [p.id, p]));
    posts = ids.map((id) => byId.get(id)).filter((p): p is (typeof rows)[number] => Boolean(p));
  } else {
    const orderBy = {
      [sort === "date" ? "timestamp" : sort]: dir,
    } as Prisma.PostOrderByWithRelationInput;
    posts = await db.post.findMany({ where: listWhere, orderBy, skip, take: POSTS_PER_PAGE });
  }

  // Benchmarks (medians, per-type medians, per-metric rate medians, text-feature
  // deltas, and each visible post's percentiles) — all aggregated in Postgres.
  const benchmarks = await getPostBenchmarks(
    account.id,
    since,
    until,
    posts.map((p) => p.id),
  );
  const medianViews = benchmarks.overallMedianViews;

  const postsWithBenchmarks = posts.map((post) => {
    const typeMedian = benchmarks.typeMedianViews[post.mediaType] ?? medianViews;
    const pp = benchmarks.perPost[post.id];
    return {
      ...post,
      typeMedianViews: typeMedian,
      viewsVsTypeMedian: typeMedian > 0 ? Math.round((post.views / typeMedian) * 10) / 10 : 0,
      viewPercentile: pp?.viewPercentile ?? 0,
      engRatePercentile: pp?.engRatePercentile ?? null,
    };
  });

  function buildParams(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    if (range) params.set("range", range);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (sort !== "date") params.set("sort", sort);
    if (dir !== "desc") params.set("dir", dir);
    if (query) params.set("q", query);
    if (mediaFilter) params.set("type", mediaFilter);
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) params.delete(key);
      else params.set(key, value);
    }
    return params;
  }

  function pageHref(nextPage: number) {
    const params = buildParams({ page: nextPage > 1 ? String(nextPage) : undefined });
    const qs = params.toString();
    return qs ? `/dashboard/posts?${qs}` : "/dashboard/posts";
  }

  const exportQs = buildParams({}).toString();
  const exportHref = exportQs ? `/api/export?${exportQs}` : "/api/export";

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.postsPage.title}</h1>
          <p className="text-muted-foreground text-sm">
            {totalPosts} {t.common.posts}
          </p>
        </div>
        <div className="flex w-full flex-col items-end gap-3 lg:w-auto lg:flex-row lg:items-start lg:gap-4">
          <TimeRangePicker
            locale={locale}
            labels={t.timeRange}
            defaultRange={range}
            defaultFrom={from}
            defaultTo={to}
          />
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            {totalPosts > 0 && (
              <a
                href={exportHref}
                className="border-input bg-background hover:bg-accent flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs"
              >
                <Download className="size-3.5" />
                {t.postsPage.exportCsv}
              </a>
            )}
            <SyncButton
              lastSyncedAt={account.syncState?.lastSyncedAt?.toISOString()}
              syncInterval={syncInterval}
              timeZone={tz}
              labels={t.sync}
              dateLocale={dateLocale}
            />
          </div>
        </div>
      </div>
      <PostList
        posts={postsWithBenchmarks}
        medianViews={medianViews}
        metricRateMedians={benchmarks.metricRateMedians}
        engagementRateMedian={benchmarks.engagementRateMedian}
        features={benchmarks.features}
        currentSort={sort}
        currentDir={dir}
        currentQuery={query}
        currentType={mediaFilter}
        availableTypes={availableTypes}
        hasPagination={totalPosts > POSTS_PER_PAGE}
        labels={t.postsPage}
        dateLocale={dateLocale}
        timeZone={tz}
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
