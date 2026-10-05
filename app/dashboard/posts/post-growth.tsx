"use client";

import { Suspense, use, useSyncExternalStore, type ReactNode } from "react";
import PostGrowthChart, { type PostGrowthChartLabels } from "@/components/charts/post-growth-chart";
import { MIN_TYPICAL_PEERS } from "@/lib/post-growth";
import type { PostGrowthDetail } from "@/lib/post-growth-data";
import { cn } from "@/lib/utils";

/** Growth is recorded during a post's first 30 days (see lib/post-metric-snapshots.ts). */
const SNAPSHOT_WINDOW_HOURS = 30 * 24;

export interface PostGrowthLabels extends PostGrowthChartLabels {
  title: string;
  firstWeek: string;
  typicalHelp: string;
  typicalNeedsMore: string;
  pending: string;
  untracked: string;
  failed: string;
}

type GrowthResult = { ok: true; data: PostGrowthDetail } | { ok: false };

// One request per post per sync: the key moves with the post's syncedAt, so
// reopening a post reuses its result until the next sync brings new readings.
const requests = new Map<string, Promise<GrowthResult>>();

function requestGrowth(postId: string, version: string): Promise<GrowthResult> {
  const key = `${postId}@${version}`;
  let request = requests.get(key);
  if (!request) {
    request = fetch(`/api/posts/${encodeURIComponent(postId)}/growth`)
      .then(async (res): Promise<GrowthResult> =>
        res.ok ? { ok: true, data: (await res.json()) as PostGrowthDetail } : { ok: false },
      )
      .catch((): GrowthResult => ({ ok: false }));
    requests.set(key, request);
  }
  return request;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
      {children}
    </p>
  );
}

function GrowthSkeleton() {
  return (
    <div className="animate-pulse space-y-3 motion-reduce:animate-none" aria-hidden>
      <div className="bg-muted/60 h-[180px] rounded-lg" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted/60 h-10 rounded-md" />
        ))}
      </div>
    </div>
  );
}

function GrowthBody({
  request,
  labels,
  locale,
}: {
  request: Promise<GrowthResult>;
  labels: PostGrowthLabels;
  locale: string;
}) {
  const result = use(request);
  if (!result.ok) return <p className="text-muted-foreground text-sm">{labels.failed}</p>;

  const growth = result.data;
  if (growth.readings === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {growth.ageHours < SNAPSHOT_WINDOW_HOURS ? labels.pending : labels.untracked}
      </p>
    );
  }

  const hasTypical = growth.curve.some((p) => p.typical !== null);
  const firstWeekOnly = growth.ageHours > 7 * 24;

  return (
    <div className="space-y-4">
      <PostGrowthChart curve={growth.curve} labels={labels} dateLocale={locale} />

      {growth.milestones.length > 0 && (
        <div className="grid grid-cols-4 gap-x-3 gap-y-4 sm:grid-cols-7">
          {growth.milestones.map((m) => (
            <div key={m.key} className="min-w-0">
              <p className="text-muted-foreground text-[11px] leading-4 tabular-nums">{m.key}</p>
              <p className="mt-0.5 text-sm leading-5 font-semibold tabular-nums">
                {m.views === null ? "—" : m.views.toLocaleString(locale)}
              </p>
              {m.vsTypical === null ? (
                <p className="text-muted-foreground text-[11px] leading-4">—</p>
              ) : (
                <p
                  className={cn(
                    "flex items-center text-[11px] leading-4 font-semibold tabular-nums",
                    m.vsTypical >= 1
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                  title={
                    m.typical === null
                      ? undefined
                      : `${labels.typical} ${m.typical.toLocaleString(locale)}`
                  }
                >
                  <svg
                    aria-hidden
                    width="7"
                    height="7"
                    viewBox="0 0 8 8"
                    className={cn("mr-0.5 shrink-0", m.vsTypical < 1 && "rotate-180")}
                  >
                    <path d="M4 0.5 L7.5 6.5 L0.5 6.5 Z" fill="currentColor" />
                  </svg>
                  {m.vsTypical}x
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        {[
          firstWeekOnly ? labels.firstWeek : null,
          hasTypical
            ? labels.typicalHelp.replace("{count}", String(growth.typicalSample))
            : labels.typicalNeedsMore.replace("{count}", String(MIN_TYPICAL_PEERS)),
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>
  );
}

const subscribeNothing = () => () => {};

export function PostGrowthSection({
  postId,
  version,
  labels,
  locale,
}: {
  postId: string;
  /** Changes whenever a sync may have added readings (the post's syncedAt). */
  version: string;
  labels: PostGrowthLabels;
  locale: string;
}) {
  // The readings are fetched from the browser only: during server rendering a
  // relative fetch can't resolve, and its failure would be cached server-side.
  const inBrowser = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  return (
    <div className="py-5">
      <div className="mb-3">
        <SectionTitle>{labels.title}</SectionTitle>
      </div>
      {inBrowser ? (
        <Suspense fallback={<GrowthSkeleton />}>
          <GrowthBody request={requestGrowth(postId, version)} labels={labels} locale={locale} />
        </Suspense>
      ) : (
        <GrowthSkeleton />
      )}
    </div>
  );
}
