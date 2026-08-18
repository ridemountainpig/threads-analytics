"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Shared chart chrome: the translucent tooltip material, dot legends, empty
// states, and gradient fills every chart composes instead of ad-hoc markup.

export interface ChartTooltipRow {
  label: ReactNode;
  value: ReactNode;
  color?: string;
  muted?: boolean;
}

// Tooltips render as a translucent material floating over the chart —
// blurred backdrop, soft shadow, values right-aligned in tabular figures.
export function ChartTooltip({
  title,
  subtitle,
  rows,
  className,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  rows: ChartTooltipRow[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-foreground/10 bg-popover/85 reduce-transparency:bg-popover reduce-transparency:backdrop-blur-none more-contrast:border-foreground/25 max-w-[18rem] min-w-[9rem] rounded-xl border px-3 py-2.5 shadow-[0_12px_32px_-8px_color-mix(in_oklch,var(--foreground)_30%,transparent)] backdrop-blur-xl",
        className,
      )}
    >
      {title != null && (
        <p className="text-foreground text-xs leading-4 font-semibold tracking-[-0.01em]">
          {title}
        </p>
      )}
      {subtitle != null && <p className="text-muted-foreground mt-0.5 text-[11px]">{subtitle}</p>}
      {rows.length > 0 && (
        <div className={cn("space-y-1", (title != null || subtitle != null) && "mt-1.5")}>
          {rows.map((row, index) => (
            <div
              key={index}
              className="flex items-baseline justify-between gap-4 text-[11px] leading-4"
            >
              <span className="text-muted-foreground inline-flex min-w-0 items-center gap-1.5">
                {row.color && (
                  <span
                    aria-hidden
                    className="inline-block size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                )}
                <span className="truncate">{row.label}</span>
              </span>
              <span
                className={cn(
                  "shrink-0 font-medium tabular-nums",
                  row.muted ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface ChartLegendItem {
  label: ReactNode;
  color: string;
  /** dot = filled series, line = solid line, dash = reference/average line. */
  shape?: "dot" | "line" | "dash";
}

// A quiet inline legend that replaces the default recharts legend: small
// color marks, muted labels, no boxes.
export function ChartLegend({
  items,
  className,
}: {
  items: ChartLegendItem[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3.5 gap-y-1", className)}>
      {items.map((item, index) => (
        <span
          key={index}
          className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px] leading-4"
        >
          {item.shape === "line" ? (
            <span
              aria-hidden
              className="inline-block h-[2px] w-3.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
          ) : item.shape === "dash" ? (
            <span
              aria-hidden
              className="inline-block w-3.5 border-t border-dashed"
              style={{ borderColor: item.color }}
            />
          ) : (
            <span
              aria-hidden
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
          )}
          {item.label}
        </span>
      ))}
    </div>
  );
}

// Empty state: a faint glyph and caption centered in the space the chart
// would occupy, so cards keep their rhythm when a metric has no data yet.
export function ChartEmptyState({ label, height = 192 }: { label: ReactNode; height?: number }) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-2.5" style={{ height }}>
      <svg
        aria-hidden
        width="36"
        height="24"
        viewBox="0 0 36 24"
        className="text-muted-foreground/40"
      >
        <rect x="2" y="14" width="6" height="10" rx="2" fill="currentColor" />
        <rect x="15" y="6" width="6" height="18" rx="2" fill="currentColor" opacity="0.7" />
        <rect x="28" y="10" width="6" height="14" rx="2" fill="currentColor" opacity="0.45" />
      </svg>
      <p className="text-muted-foreground/80 text-xs">{label}</p>
    </div>
  );
}

// Vertical fade used under hero lines, Apple Health style. Render inside the
// chart; reference with fill={`url(#${id})`}.
export function ChartAreaGradient({ id, color }: { id: string; color: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0.24} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

// Series animation props: quick ease-out reveals, dropped entirely for
// users who prefer reduced motion. Spread onto Bar/Line/Area/Pie/Scatter.
export function useChartMotion() {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => true,
  );
  return {
    isAnimationActive: !reduced,
    animationDuration: 500,
    animationEasing: "ease-out",
  } as const;
}
