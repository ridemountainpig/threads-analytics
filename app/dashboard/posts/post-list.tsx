"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, ExternalLink, Search } from "lucide-react";
import { cn } from "@/lib/utils";

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

function PercentileBar({ label, percentile }: { label: string; percentile: number | null }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {label}
        </p>
        <span className="text-sm font-semibold tabular-nums">
          {percentile === null ? "—" : `P${percentile}`}
        </span>
      </div>
      <div className="bg-muted h-2.5 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${percentile ?? 0}%` }} />
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
  const engagementMetrics = [
    { key: "likes" as const, label: labels.likes, color: "bg-primary" },
    { key: "replies" as const, label: labels.replies, color: "bg-emerald-500" },
    { key: "reposts" as const, label: labels.reposts, color: "bg-amber-500" },
    { key: "quotes" as const, label: labels.quotes, color: "bg-violet-500" },
    { key: "shares" as const, label: labels.shares, color: "bg-sky-500" },
  ];
  const maxMetric = Math.max(1, ...engagementMetrics.map(({ key }) => post[key]));

  return (
    <div className="divide-y">
      {/* Post content */}
      <div className="pb-5">
        <p className="text-sm leading-relaxed">{post.text || labels.noText}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground text-sm">
            {formatPostDate(post.timestamp, locale, timeZone, true)}
          </span>
          <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs font-medium">
            {mediaTypeLabel}
          </span>
          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
            >
              <ExternalLink className="size-3.5" />
              {labels.viewOnThreads}
            </a>
          )}
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-1 gap-3 py-5 sm:grid-cols-3">
        <div className="bg-muted/50 rounded-md p-4 text-center">
          <p className="text-muted-foreground text-sm">{labels.views}</p>
          <p className="mt-1 text-2xl font-semibold">{post.views.toLocaleString(locale)}</p>
        </div>
        <div className="bg-muted/50 rounded-md p-4 text-center">
          <p className="text-muted-foreground text-sm">{labels.engRate}</p>
          <p className="mt-1 text-2xl font-semibold">{engRate}%</p>
        </div>
        <div className="bg-muted/50 rounded-md p-4 text-center">
          <p className="text-muted-foreground text-sm">
            {labels.vsTypeMedian ?? labels.vsMedianViews ?? labels.vsAvgViews}
          </p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold",
              post.viewsVsTypeMedian >= 1 ? "text-green-600" : "text-red-500",
            )}
          >
            {post.viewsVsTypeMedian}x
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {mediaTypeLabel} · {post.typeMedianViews.toLocaleString(locale)}
          </p>
        </div>
      </div>

      {/* Percentiles: reach and engagement rate against the whole range */}
      <div className="space-y-4 py-5">
        <PercentileBar
          label={labels.viewPercentile ?? "View Percentile"}
          percentile={post.viewPercentile}
        />
        <PercentileBar
          label={labels.engRatePercentile ?? "Eng. Rate Percentile"}
          percentile={post.engRatePercentile}
        />
        <p className="text-muted-foreground text-xs">
          {labels.medianViews ?? "Median views"}: {medianViews.toLocaleString(locale)}
          {" · "}
          {labels.medianEngRate ?? "Median eng. rate"}: {engagementRateMedian}%
        </p>
      </div>

      {/* Text features present in this post, with their range-wide reach delta */}
      {activeFeatures.length > 0 && (
        <div className="py-5">
          <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            {labels.textFeatures ?? "Text Features"}
          </p>
          <div className="flex flex-wrap gap-2">
            {activeFeatures.map((f) => (
              <span
                key={f.feature}
                className="bg-muted flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              >
                {featureLabels[f.feature]}
                {f.deltaPct !== null && (
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      f.deltaPct >= 0 ? "text-green-600" : "text-red-500",
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
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
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
                <div className="bg-muted h-2.5 flex-1 overflow-hidden rounded-full">
                  <div
                    className={cn("h-full rounded-full transition-all", color)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span
                  title={medianTip}
                  className="flex w-24 shrink-0 items-center justify-end gap-0.5 text-right text-sm font-semibold tabular-nums"
                >
                  {value} · {viewRate.toFixed(1)}%
                  {diff > 0.005 ? (
                    <ChevronUp className="size-3.5 text-green-600" aria-label={medianTip} />
                  ) : diff < -0.005 ? (
                    <ChevronDown
                      className="text-muted-foreground size-3.5"
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
        "flex min-h-[520px] flex-col gap-0 overflow-hidden rounded-lg border lg:flex-row",
        hasPagination ? "lg:h-[calc(100vh-13rem)]" : "lg:h-[calc(100vh-10rem)]",
      )}
    >
      {/* Left: post list */}
      <div className="flex max-h-[45vh] shrink-0 flex-col border-b lg:max-h-none lg:w-[40%] lg:border-r lg:border-b-0">
        {/* Sort controls */}
        <div className="space-y-2 border-b px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">{labels.sort}</span>
            {SORT_OPTIONS.map((value) => (
              <button
                key={value}
                onClick={() => setSort(value)}
                className={`rounded px-2.5 py-1 text-sm transition-colors ${
                  currentSort === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {sortLabels[value]}
              </button>
            ))}
            <button
              onClick={toggleDir}
              title={currentDir === "asc" ? labels.ascending : labels.descending}
              aria-label={currentDir === "asc" ? labels.ascending : labels.descending}
              className="bg-muted text-muted-foreground hover:bg-muted/80 flex h-7 items-center justify-center rounded px-2 transition-colors"
            >
              {currentDir === "asc" ? (
                <ArrowUp className="size-3.5" />
              ) : (
                <ArrowDown className="size-3.5" />
              )}
            </button>
          </div>
          {/* Search + media type filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={labels.searchPlaceholder ?? "Search posts..."}
                className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border py-1.5 pr-3 pl-8 text-sm focus:ring-1 focus:outline-none"
              />
            </div>
          </div>
          {availableTypes.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setMediaFilter("")}
                className={`rounded px-2 py-0.5 text-xs transition-colors ${
                  currentType === ""
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {labels.allTypes ?? "All"}
              </button>
              {availableTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setMediaFilter(type)}
                  className={`rounded px-2 py-0.5 text-xs transition-colors ${
                    currentType === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {labels.mediaTypes?.[type] ?? type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Post list */}
        <div ref={listScrollRef} className="flex-1 overflow-y-auto">
          {posts.length === 0 ? (
            <div className="text-muted-foreground p-6 text-center text-sm">{labels.noPosts}</div>
          ) : null}
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => selectPost(post.id)}
              className={cn(
                "hover:bg-accent/50 cursor-pointer border-b px-4 py-3.5 transition-colors last:border-b-0",
                selectedId === post.id && "bg-accent",
              )}
            >
              <p className="line-clamp-2 text-sm leading-snug">{post.text || labels.noText}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                <span className="text-muted-foreground text-xs">
                  {formatPostDate(post.timestamp, locale, timeZone)}
                </span>
                <span className="text-xs font-semibold">
                  {post.views.toLocaleString(locale)} {labels.views.toLowerCase()}
                </span>
                <span className="text-muted-foreground text-xs">
                  {post.likes} {labels.likes.toLowerCase()} · {post.replies}{" "}
                  {labels.replies.toLowerCase()}
                </span>
              </div>
            </div>
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
