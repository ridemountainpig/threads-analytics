"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ExternalLink, Search } from "lucide-react";
import { cn } from "@/lib/utils";

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
  viewsVsMedian: number;
  viewPercentile: number;
}

interface PostListProps {
  posts: Post[];
  medianViews: number;
  currentSort: string;
  hasPagination?: boolean;
  dateLocale?: string;
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
    viewPercentile?: string;
    medianViews?: string;
    engagementBreakdown: string;
    selectPost: string;
    reposts: string;
    quotes: string;
    shares: string;
    mediaTypes?: Record<string, string>;
    searchPlaceholder?: string;
    allTypes?: string;
  };
}

const SORT_OPTIONS = ["date", "views", "likes"] as const;

function PostDetail({
  post,
  medianViews,
  labels,
  dateLocale,
}: {
  post: Post;
  medianViews: number;
  labels: PostListProps["labels"];
  dateLocale?: string;
}) {
  const engRate =
    post.views > 0
      ? (((post.likes + post.replies + post.reposts + post.quotes) / post.views) * 100).toFixed(2)
      : "0.00";
  const totalEngagement = post.likes + post.replies + post.reposts + post.quotes + post.shares;
  const mediaTypeLabel = labels.mediaTypes?.[post.mediaType] ?? post.mediaType;
  const engagementMetrics = [
    { key: "likes" as const, label: labels.likes, color: "bg-primary" },
    { key: "replies" as const, label: labels.replies, color: "bg-emerald-500" },
    { key: "reposts" as const, label: labels.reposts, color: "bg-amber-500" },
    { key: "quotes" as const, label: labels.quotes, color: "bg-violet-500" },
    { key: "shares" as const, label: labels.shares, color: "bg-sky-500" },
  ];

  return (
    <div className="divide-y">
      {/* Post content */}
      <div className="pb-5">
        <p className="text-sm leading-relaxed">{post.text || labels.noText}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground text-sm">
            {new Date(post.timestamp).toLocaleDateString(dateLocale, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
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
          <p className="mt-1 text-2xl font-semibold">{post.views.toLocaleString()}</p>
        </div>
        <div className="bg-muted/50 rounded-md p-4 text-center">
          <p className="text-muted-foreground text-sm">{labels.engRate}</p>
          <p className="mt-1 text-2xl font-semibold">{engRate}%</p>
        </div>
        <div className="bg-muted/50 rounded-md p-4 text-center">
          <p className="text-muted-foreground text-sm">
            {labels.vsMedianViews ?? labels.vsAvgViews}
          </p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold",
              post.viewsVsMedian >= 1 ? "text-green-600" : "text-red-500",
            )}
          >
            {post.viewsVsMedian}x
          </p>
        </div>
      </div>

      <div className="pb-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {labels.viewPercentile ?? "View Percentile"}
          </p>
          <span className="mt-8 text-sm font-semibold tabular-nums">P{post.viewPercentile}</span>
        </div>
        <div className="bg-muted h-2.5 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full"
            style={{ width: `${post.viewPercentile}%` }}
          />
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {labels.medianViews ?? "Median views"}: {medianViews.toLocaleString()}
        </p>
      </div>

      {/* Engagement breakdown */}
      <div className="py-5">
        <p className="text-muted-foreground mb-4 text-xs font-semibold tracking-wider uppercase">
          {labels.engagementBreakdown}
        </p>
        <div className="space-y-3">
          {engagementMetrics.map(({ key, label, color }) => {
            const value = post[key];
            const pct = totalEngagement > 0 ? (value / totalEngagement) * 100 : 0;
            const viewRate = post.views > 0 ? (value / post.views) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-muted-foreground w-16 shrink-0 text-sm">{label}</span>
                <div className="bg-muted h-2.5 flex-1 overflow-hidden rounded-full">
                  <div
                    className={cn("h-full rounded-full transition-all", color)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {value} · {viewRate.toFixed(1)}%
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
  currentSort,
  hasPagination = false,
  labels,
  dateLocale,
}: PostListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(posts[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState("");
  const listScrollRef = useRef<HTMLDivElement>(null);
  const detailScrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (listScrollRef.current) listScrollRef.current.scrollTop = 0;
    if (detailScrollRef.current) detailScrollRef.current.scrollTop = 0;
    setSelectedId(posts[0]?.id ?? null);
  }, [posts]);

  function setSort(sort: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const mediaTypes = useMemo(() => {
    const types = new Set(posts.map((p) => p.mediaType));
    return Array.from(types).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchesSearch =
        !searchQuery || p.text.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMedia = !mediaFilter || p.mediaType === mediaFilter;
      return matchesSearch && matchesMedia;
    });
  }, [posts, searchQuery, mediaFilter]);

  const selectedPost = filteredPosts.find((p) => p.id === selectedId) ?? filteredPosts[0] ?? null;

  if (!posts.length) {
    return <div className="text-muted-foreground p-8 text-center text-sm">{labels.noPosts}</div>;
  }

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
                {labels[value]}
              </button>
            ))}
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
          {mediaTypes.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setMediaFilter("")}
                className={`rounded px-2 py-0.5 text-xs transition-colors ${
                  mediaFilter === ""
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {labels.allTypes ?? "All"}
              </button>
              {mediaTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setMediaFilter(type)}
                  className={`rounded px-2 py-0.5 text-xs transition-colors ${
                    mediaFilter === type
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
          {filteredPosts.length === 0 ? (
            <div className="text-muted-foreground p-6 text-center text-sm">{labels.noPosts}</div>
          ) : null}
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedId(post.id)}
              className={cn(
                "hover:bg-accent/50 cursor-pointer border-b px-4 py-3.5 transition-colors",
                selectedId === post.id && "bg-accent",
              )}
            >
              <p className="line-clamp-2 text-sm leading-snug">{post.text || labels.noText}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                <span className="text-muted-foreground text-xs">
                  {new Date(post.timestamp).toLocaleDateString(dateLocale)}
                </span>
                <span className="text-xs font-semibold">
                  {post.views.toLocaleString()} {labels.views.toLowerCase()}
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
              labels={labels}
              dateLocale={dateLocale}
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
