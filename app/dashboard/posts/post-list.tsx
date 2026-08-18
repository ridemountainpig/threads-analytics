"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, ExternalLink, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { chartColors, chartPalette } from "@/components/charts/chart-style";

// Capsule filter chip shared by the sort row and media-type row: filled when
// selected, instant pressed-state feedback, consistent with chart filters.
function FilterChip({
  selected,
  onClick,
  title,
  children,
  size = "sm",
}: {
  selected: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "xs";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex items-center rounded-full text-xs transition-[background-color,color,transform] duration-150 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100",
        size === "sm" ? "h-7 px-3" : "h-6 px-2.5",
        selected
          ? "bg-primary text-primary-foreground font-medium"
          : "bg-muted/70 text-foreground/70 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

type TextFeature = "question" | "link";

interface FeatureDelta {
  feature: TextFeature;
  deltaPct: number | null;
  withMedian: number;
  withoutMedian: number;
  withCount: number;
}

interface MetricRateMedians {
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  shares: number;
}

interface Post {
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
  typeMedianViews: number;
  viewsVsTypeMedian: number;
  viewPercentile: number;
  engRatePercentile: number | null;
}

interface PostListProps {
  posts: Post[];
  medianViews: number;
  metricRateMedians: MetricRateMedians;
  engagementRateMedian: number;
  features: FeatureDelta[];
  currentSort: string;
  currentDir: string;
  currentQuery: string;
  currentType: string;
  availableTypes: string[];
  hasPagination?: boolean;
  dateLocale?: string;
  timeZone: string;
  labels: {
    sort: string;
    date: string;
    views: string;
    likes: string;
    replies: string;
    noPosts: string;
    noText: string;
    viewOnThreads: string;
    engRate: string;
    vsAvgViews: string;
    vsMedianViews?: string;
    vsTypeMedian?: string;
    viewPercentile?: string;
    engRatePercentile?: string;
    medianViews?: string;
    medianEngRate?: string;
    medianShort?: string;
    vsMedian?: string;
    textFeatures?: string;
    featureQuestion?: string;
    featureLink?: string;
    engagementBreakdown: string;
    selectPost: string;
    reposts: string;
    quotes: string;
    shares: string;
    mediaTypes?: Record<string, string>;
    searchPlaceholder?: string;
    clearSearch?: string;
    allTypes?: string;
    ascending?: string;
    descending?: string;
  };
}

const hasLink = (text: string) => /https?:\/\//i.test(text);
const hasQuestion = (text: string) => /[?？]/.test(text);

const SORT_OPTIONS = ["date", "views", "likes", "replies", "shares", "engRate"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

function formatPostDate(
  date: Date | string,
  dateLocale: string,
  timeZone: string,
  includeTime = false,
) {
  return new Intl.DateTimeFormat(dateLocale, {
    timeZone,
    year: "numeric",
    month: includeTime ? "short" : "numeric",
    day: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(date));
}

function PercentileBar({
  label,
  percentile,
  color,
}: {
  label: string;
  percentile: number | null;
  color: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
          {label}
        </p>
        <span className="text-sm font-semibold tabular-nums">
          {percentile === null ? "—" : `P${percentile}`}
        </span>
      </div>
      <div className="bg-muted relative h-2 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${percentile ?? 0}%`, backgroundColor: color }}
        />
        {/* Hairline tick at P50 anchors the fill against the account median. */}
        <div aria-hidden className="bg-foreground/20 absolute inset-y-0 left-1/2 w-px" />
      </div>
    </div>
  );
}

function PostDetail({
  post,
  medianViews,
  metricRateMedians,
  engagementRateMedian,
  features,
  labels,
  dateLocale,
  timeZone,
}: {
  post: Post;
  medianViews: number;
  metricRateMedians: MetricRateMedians;
  engagementRateMedian: number;
  features: FeatureDelta[];
  labels: PostListProps["labels"];
  dateLocale?: string;
  timeZone: string;
}) {
  const locale = dateLocale ?? "en-US";
  // Engagement excludes shares, matching the app-wide rate (see getMetricRates).
  const engagement = post.likes + post.replies + post.reposts + post.quotes;
  const engRate = post.views > 0 ? ((engagement / post.views) * 100).toFixed(2) : "0.00";
  const mediaTypeLabel = labels.mediaTypes?.[post.mediaType] ?? post.mediaType;
  const featureLabels: Record<TextFeature, string> = {
    question: labels.featureQuestion ?? "Question",
    link: labels.featureLink ?? "Link",
  };
  // Only surface features this post actually has, with the range-wide insight.
  const activeFeatures = features.filter(
    (f) =>
      (f.feature === "question" && hasQuestion(post.text)) ||
      (f.feature === "link" && hasLink(post.text)),
  );
  // Same semantic hues as the analytics charts, so "likes" is the same pink
  // everywhere in the app.
  const engagementMetrics = [
    { key: "likes" as const, label: labels.likes, color: chartColors.likes },
    { key: "replies" as const, label: labels.replies, color: chartColors.reply },
    { key: "reposts" as const, label: labels.reposts, color: chartColors.repost },
    { key: "quotes" as const, label: labels.quotes, color: chartColors.quote },
    { key: "shares" as const, label: labels.shares, color: chartColors.share },
  ];
  const maxMetric = Math.max(1, ...engagementMetrics.map(({ key }) => post[key]));

  return (
    <div className="divide-border/60 divide-y">
      {/* Post content — the hero of the panel, set a step larger */}
      <div className="pb-5">
        <p className="text-[15px] leading-relaxed">{post.text || labels.noText}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground text-sm tabular-nums">
            {formatPostDate(post.timestamp, locale, timeZone, true)}
          </span>
          <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
            {mediaTypeLabel}
          </span>
          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-tint flex items-center gap-1 text-sm hover:opacity-80"
            >
              <ExternalLink className="size-3.5" />
              {labels.viewOnThreads}
            </a>
          )}
        </div>
      </div>

      {/* Key stats: an App Store-style stat strip — captions above, big
          tabular figures below, hairlines between instead of gray boxes */}
      <div className="divide-border/60 grid grid-cols-1 divide-y py-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="py-3 first:pt-0 last:pb-0 sm:px-6 sm:py-0 sm:first:pl-0 sm:last:pr-0">
          <p className="text-muted-foreground text-[11px] leading-4 font-semibold tracking-[0.08em] uppercase">
            {labels.views}
          </p>
          <p className="mt-1.5 text-2xl leading-7 font-semibold tracking-[-0.01em] tabular-nums">
            {post.views.toLocaleString(locale)}
          </p>
        </div>
        <div className="py-3 first:pt-0 last:pb-0 sm:px-6 sm:py-0 sm:first:pl-0 sm:last:pr-0">
          <p className="text-muted-foreground text-[11px] leading-4 font-semibold tracking-[0.08em] uppercase">
            {labels.engRate}
          </p>
          <p className="mt-1.5 text-2xl leading-7 font-semibold tracking-[-0.01em] tabular-nums">
            {engRate}%
          </p>
        </div>
        <div className="py-3 first:pt-0 last:pb-0 sm:px-6 sm:py-0 sm:first:pl-0 sm:last:pr-0">
          <p className="text-muted-foreground text-[11px] leading-4 font-semibold tracking-[0.08em] uppercase">
            {labels.vsTypeMedian ?? labels.vsMedianViews ?? labels.vsAvgViews}
          </p>
          <p className="mt-1.5 flex items-baseline gap-2">
            <span
              className={cn(
                "text-2xl leading-7 font-semibold tracking-[-0.01em] tabular-nums",
                post.viewsVsTypeMedian >= 1
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              <svg
                aria-hidden
                width="9"
                height="9"
                viewBox="0 0 8 8"
                className={cn(
                  "mr-1 inline-block shrink-0",
                  post.viewsVsTypeMedian < 1 && "rotate-180",
                )}
              >
                <path d="M4 0.5 L7.5 6.5 L0.5 6.5 Z" fill="currentColor" />
              </svg>
              {post.viewsVsTypeMedian}x
            </span>
            <span className="text-muted-foreground text-[11px] leading-4 tabular-nums">
              {mediaTypeLabel} · {post.typeMedianViews.toLocaleString(locale)}
            </span>
          </p>
        </div>
      </div>

      {/* Percentiles: reach and engagement rate against the whole range */}
      <div className="space-y-4 py-5">
        <PercentileBar
          label={labels.viewPercentile ?? "View Percentile"}
          percentile={post.viewPercentile}
          color={chartPalette.blue}
        />
        <PercentileBar
          label={labels.engRatePercentile ?? "Eng. Rate Percentile"}
          percentile={post.engRatePercentile}
          color={chartPalette.green}
        />
        <p className="text-muted-foreground text-xs tabular-nums">
          {labels.medianViews ?? "Median views"}: {medianViews.toLocaleString(locale)}
          {" · "}
          {labels.medianEngRate ?? "Median eng. rate"}: {engagementRateMedian}%
        </p>
      </div>

      {/* Text features present in this post, with their range-wide reach delta */}
      {activeFeatures.length > 0 && (
        <div className="py-5">
          <p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-[0.08em] uppercase">
            {labels.textFeatures ?? "Text Features"}
          </p>
          <div className="flex flex-wrap gap-2">
            {activeFeatures.map((f) => (
              <span
                key={f.feature}
                className="bg-muted/70 flex items-center gap-1.5 rounded-full py-1 pr-1.5 pl-2.5 text-xs font-medium"
              >
                {featureLabels[f.feature]}
                {f.deltaPct !== null && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[11px] leading-4 font-semibold tabular-nums",
                      f.deltaPct >= 0
                        ? "bg-green-600/10 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                        : "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400",
                    )}
                  >
                    {f.deltaPct >= 0 ? "+" : ""}
                    {f.deltaPct}%
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Engagement breakdown, each rate flagged against the account median */}
      <div className="py-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
            {labels.engagementBreakdown}
          </p>
          {/* Legend: the per-row arrow compares this post's rate to the account median */}
          <span className="text-muted-foreground flex shrink-0 items-center gap-0.5 text-[11px]">
            <ChevronUp className="size-3 text-green-600" />
            <ChevronDown className="size-3" />
            {labels.vsMedian ?? "vs median"}
          </span>
        </div>
        <div className="space-y-3">
          {engagementMetrics.map(({ key, label, color }) => {
            const value = post[key];
            const pct = (value / maxMetric) * 100;
            const viewRate = post.views > 0 ? (value / post.views) * 100 : 0;
            const median = metricRateMedians[key];
            const diff = viewRate - median;
            const medianTip = `${labels.medianShort ?? "Median"} ${median}%`;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-muted-foreground w-16 shrink-0 text-sm">{label}</span>
                <div className="bg-muted/60 h-2 flex-1 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <span
                  title={medianTip}
                  className="flex w-24 shrink-0 items-baseline justify-end gap-0.5 text-right tabular-nums"
                >
                  <span className="text-sm font-semibold">{value.toLocaleString(locale)}</span>
                  <span className="text-muted-foreground text-xs">· {viewRate.toFixed(1)}%</span>
                  {diff > 0.005 ? (
                    <ChevronUp
                      className="size-3.5 self-center text-green-600"
                      aria-label={medianTip}
                    />
                  ) : diff < -0.005 ? (
                    <ChevronDown
                      className="text-muted-foreground size-3.5 self-center"
                      aria-label={medianTip}
                    />
                  ) : (
                    <span className="inline-block size-3.5" />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PostList({
  posts,
  medianViews,
  metricRateMedians,
  engagementRateMedian,
  features,
  currentSort,
  currentDir,
  currentQuery,
  currentType,
  availableTypes,
  hasPagination = false,
  labels,
  dateLocale,
  timeZone,
}: PostListProps) {
  const locale = dateLocale ?? "en-US";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const fromUrl = searchParams.get("post");
    if (fromUrl && posts.some((p) => p.id === fromUrl)) return fromUrl;
    return posts[0]?.id ?? null;
  });
  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const lastPushedQuery = useRef(currentQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const detailScrollRef = useRef<HTMLDivElement>(null);

  // When the visible page changes (pagination/sort/filter), keep the current
  // selection if it's still present, otherwise fall back to the first post.
  useEffect(() => {
    setSelectedId((prev) => (posts.some((p) => p.id === prev) ? prev : (posts[0]?.id ?? null)));
    if (listScrollRef.current) listScrollRef.current.scrollTop = 0;
    if (detailScrollRef.current) detailScrollRef.current.scrollTop = 0;
  }, [posts]);

  // Debounced server-side search: filtering must span every page, not just the
  // 50 posts currently loaded.
  useEffect(() => {
    if (searchQuery === currentQuery) return;
    const handle = setTimeout(() => {
      lastPushedQuery.current = searchQuery;
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) params.set("q", searchQuery);
      else params.delete("q");
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 350);
    return () => clearTimeout(handle);
  }, [searchQuery, currentQuery, searchParams, pathname, router]);

  // Sync the input when the query changes from outside (e.g. back/forward).
  useEffect(() => {
    if (currentQuery !== lastPushedQuery.current) {
      lastPushedQuery.current = currentQuery;
      setSearchQuery(currentQuery);
    }
  }, [currentQuery]);

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function setSort(sort: SortOption) {
    pushParams((params) => {
      if (sort === "date") params.delete("sort");
      else params.set("sort", sort);
    });
  }

  function toggleDir() {
    const next = currentDir === "asc" ? "desc" : "asc";
    pushParams((params) => {
      if (next === "desc") params.delete("dir");
      else params.set("dir", "asc");
    });
  }

  function setMediaFilter(type: string) {
    pushParams((params) => {
      if (!type) params.delete("type");
      else params.set("type", type);
    });
  }

  function selectPost(id: string) {
    setSelectedId(id);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("post", id);
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    }
  }

  const sortLabels: Record<SortOption, string> = {
    date: labels.date,
    views: labels.views,
    likes: labels.likes,
    replies: labels.replies,
    shares: labels.shares,
    engRate: labels.engRate,
  };

  const selectedPost = posts.find((p) => p.id === selectedId) ?? posts[0] ?? null;

  return (
    <div
      className={cn(
        "ring-foreground/10 flex min-h-[520px] flex-col gap-0 overflow-hidden rounded-xl ring-1 lg:flex-row",
        hasPagination ? "lg:h-[calc(100vh-13rem)]" : "lg:h-[calc(100vh-10rem)]",
      )}
    >
      {/* Left: post list */}
      <div className="flex max-h-[45vh] shrink-0 flex-col border-b lg:max-h-none lg:w-[40%] lg:border-r lg:border-b-0">
        {/* Sort controls */}
        <div className="space-y-2 border-b px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground mr-0.5 text-xs">{labels.sort}</span>
            {SORT_OPTIONS.map((value) => (
              <FilterChip
                key={value}
                selected={currentSort === value}
                onClick={() => setSort(value)}
              >
                {sortLabels[value]}
              </FilterChip>
            ))}
            <button
              onClick={toggleDir}
              title={currentDir === "asc" ? labels.ascending : labels.descending}
              aria-label={currentDir === "asc" ? labels.ascending : labels.descending}
              className="bg-muted/70 text-foreground/70 hover:text-foreground flex size-7 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              {currentDir === "asc" ? (
                <ArrowUp className="size-3.5" />
              ) : (
                <ArrowDown className="size-3.5" />
              )}
            </button>
          </div>
          {/* Search: a recessed capsule field, Apple search-bar style */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={labels.searchPlaceholder ?? "Search posts..."}
                className="bg-muted/70 placeholder:text-muted-foreground focus-visible:ring-ring/40 w-full rounded-full py-1.5 pr-9 pl-9 text-sm transition-[background-color,box-shadow] duration-150 outline-none focus-visible:ring-2 motion-reduce:transition-none [&::-webkit-search-cancel-button]:hidden"
              />
              {/* Apple search-bar grammar: a clear affordance appears once
                  there's something to clear, and hands focus back for the
                  next query. */}
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  aria-label={labels.clearSearch ?? "Clear search"}
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted absolute top-1/2 right-1.5 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
          {availableTypes.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip
                size="xs"
                selected={currentType === ""}
                onClick={() => setMediaFilter("")}
              >
                {labels.allTypes ?? "All"}
              </FilterChip>
              {availableTypes.map((type) => (
                <FilterChip
                  key={type}
                  size="xs"
                  selected={currentType === type}
                  onClick={() => setMediaFilter(type)}
                >
                  {labels.mediaTypes?.[type] ?? type}
                </FilterChip>
              ))}
            </div>
          )}
        </div>

        {/* Post list: floating rounded selection, macOS-sidebar style */}
        <div ref={listScrollRef} className="flex-1 overflow-y-auto p-1.5">
          {posts.length === 0 ? (
            <div className="text-muted-foreground p-6 text-center text-sm">{labels.noPosts}</div>
          ) : null}
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => selectPost(post.id)}
              className={cn(
                "hover:bg-muted/60 active:bg-muted focus-visible:ring-ring/50 block w-full rounded-lg px-3 py-3 text-left transition-colors duration-150 outline-none focus-visible:ring-2 motion-reduce:transition-none",
                selectedId === post.id && "bg-accent hover:bg-accent active:bg-accent",
              )}
            >
              <p className="line-clamp-2 text-sm leading-snug">{post.text || labels.noText}</p>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <span className="text-xs font-semibold tabular-nums">
                  {post.views.toLocaleString(locale)} {labels.views.toLowerCase()}
                </span>
                <span className="text-muted-foreground text-[11px] tabular-nums">
                  {post.likes} {labels.likes.toLowerCase()} · {post.replies}{" "}
                  {labels.replies.toLowerCase()}
                </span>
                <span className="text-muted-foreground/80 ml-auto text-[11px] tabular-nums">
                  {formatPostDate(post.timestamp, locale, timeZone)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: detail panel */}
      <div ref={detailScrollRef} className="flex-1 overflow-y-auto">
        {selectedPost ? (
          <div className="p-6">
            <PostDetail
              post={selectedPost}
              medianViews={medianViews}
              metricRateMedians={metricRateMedians}
              engagementRateMedian={engagementRateMedian}
              features={features}
              labels={labels}
              dateLocale={dateLocale}
              timeZone={timeZone}
            />
          </div>
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            {labels.selectPost}
          </div>
        )}
      </div>
    </div>
  );
}
