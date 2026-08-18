"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatShortDate } from "./chart-style";

export type Granularity = "day" | "week" | "month";

// Data dates arrive either as ISO timestamps (API user insights) or as
// YYYY-MM-DD calendar dates already resolved in the analytics time zone.
export function toCalendarDate(value: string, timeZone: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function utcDate(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00Z`);
}

// ≤ ~3 months of data reads fine daily, up to ~a year weekly, beyond that
// monthly — thresholds carry a few days of slack so the 90d / 1y range
// presets land on the granularity users expect.
export function defaultGranularity(span: number): Granularity {
  if (span <= 92) return "day";
  if (span <= 370) return "week";
  return "month";
}

function calendarSpanDays(dates: string[], timeZone: string): number {
  if (dates.length < 2) return dates.length;
  let first = "";
  let last = "";
  for (const value of dates) {
    const key = toCalendarDate(value, timeZone);
    if (!first || key < first) first = key;
    if (!last || key > last) last = key;
  }
  return Math.round((utcDate(last).getTime() - utcDate(first).getTime()) / 86_400_000) + 1;
}

// Bucket key is the period's first calendar day (YYYY-MM-DD), so existing
// date formatters keep working on aggregated series.
export function bucketStart(dateKey: string, granularity: Granularity): string {
  if (granularity === "day") return dateKey;
  if (granularity === "month") return `${dateKey.slice(0, 7)}-01`;
  const date = utcDate(dateKey);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

export function aggregateByGranularity<T, R>(
  data: T[],
  granularity: Granularity,
  timeZone: string,
  getDate: (item: T) => string,
  fold: (items: T[], bucket: string) => R,
): R[] {
  const buckets = new Map<string, T[]>();
  for (const item of data) {
    const key = bucketStart(toCalendarDate(getDate(item), timeZone), granularity);
    const existing = buckets.get(key);
    if (existing) existing.push(item);
    else buckets.set(key, [item]);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket, items]) => fold(items, bucket));
}

export function formatBucketLabel(
  bucket: string,
  granularity: Granularity,
  locale: string,
  timeZone: string,
  options?: { year?: boolean },
) {
  if (granularity === "month") {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      year: options?.year ? "numeric" : undefined,
      timeZone: "UTC",
    }).format(utcDate(bucket));
  }
  return formatShortDate(bucket, locale, timeZone, options);
}

// Tooltip label for a weekly bucket: "Aug 4 – Aug 10".
export function formatBucketTooltipLabel(
  bucket: string,
  granularity: Granularity,
  locale: string,
  timeZone: string,
  options?: { year?: boolean },
) {
  if (granularity !== "week") {
    return formatBucketLabel(bucket, granularity, locale, timeZone, options);
  }
  const end = utcDate(bucket);
  end.setUTCDate(end.getUTCDate() + 6);
  const endKey = end.toISOString().slice(0, 10);
  return `${formatShortDate(bucket, locale, timeZone, options)} – ${formatShortDate(endKey, locale, timeZone, options)}`;
}

const STORAGE_PREFIX = "chart-granularity:";

function isGranularity(value: string | null): value is Granularity {
  return value === "day" || value === "week" || value === "month";
}

// Granularity defaults from the data's span; an explicit pick is stored per
// chart (storageKey) so it survives reloads, independently for each chart.
// Charts without a stored pick keep following the span-based default. The
// stored value is read after mount so server and client render the same
// initial markup. The toggle only appears once aggregation has an effect;
// while it is hidden the span-based default wins so short ranges always
// render daily.
export function useGranularity(dates: string[], timeZone: string, storageKey?: string) {
  const span = useMemo(() => calendarSpanDays(dates, timeZone), [dates, timeZone]);
  const preferred = defaultGranularity(span);
  const [choice, setChoice] = useState<Granularity | null>(null);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = window.localStorage.getItem(STORAGE_PREFIX + storageKey);
      if (isGranularity(stored)) setChoice(stored);
    } catch {
      // localStorage unavailable (e.g. blocked storage) — keep the default.
    }
  }, [storageKey]);

  const setGranularity = (next: Granularity) => {
    setChoice(next);
    if (!storageKey) return;
    try {
      window.localStorage.setItem(STORAGE_PREFIX + storageKey, next);
    } catch {
      // Persisting is best-effort; the in-session choice still applies.
    }
  };

  const showToggle = span > 92;
  return { granularity: showToggle && choice ? choice : preferred, setGranularity, showToggle };
}

export interface GranularityLabels {
  day: string;
  week: string;
  month: string;
}

export function GranularityToggle({
  value,
  onChange,
  labels,
}: {
  value: Granularity;
  onChange: (granularity: Granularity) => void;
  labels: GranularityLabels;
}) {
  const options: Granularity[] = ["day", "week", "month"];
  const buttonRefs = useRef(new Map<Granularity, HTMLButtonElement>());
  const [pill, setPill] = useState<{ x: number; width: number } | null>(null);

  // The raised segment is a single pill that glides to the selection instead
  // of each button painting its own background. Measured after layout (and
  // re-measured when labels change size, e.g. on locale switch).
  useLayoutEffect(() => {
    const button = buttonRefs.current.get(value);
    if (button) setPill({ x: button.offsetLeft, width: button.offsetWidth });
  }, [value, labels]);

  // Styled as a segmented control: a recessed track with the selected
  // segment raised on a background-colored pill. Feedback lands on press
  // (active:scale) rather than on release; reduced motion snaps the pill.
  return (
    <div className="bg-muted/70 relative inline-flex items-center rounded-full p-0.5">
      {pill && (
        <span
          aria-hidden
          className="bg-background ring-foreground/5 absolute inset-y-0.5 left-0 rounded-full shadow-sm ring-1 transition-[translate,width] duration-200 ease-out motion-reduce:transition-none"
          style={{ translate: `${pill.x}px 0`, width: pill.width }}
        />
      )}
      {options.map((option) => (
        <button
          key={option}
          ref={(node) => {
            if (node) buttonRefs.current.set(option, node);
            else buttonRefs.current.delete(option);
          }}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "relative inline-flex h-6 items-center rounded-full px-2.5 text-[11px] transition-[color,transform] duration-200 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100",
            value === option
              ? "text-foreground font-medium"
              : "text-foreground/70 hover:text-foreground",
          )}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}
