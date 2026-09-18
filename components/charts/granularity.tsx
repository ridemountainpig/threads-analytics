"use client";

import { useEffect, useMemo, useState } from "react";
import { formatShortDate } from "./chart-style";
import { SegmentedControl } from "./segmented-control";

import { bucketStart, defaultGranularity, type Granularity } from "@/lib/granularity";

export { bucketStart, defaultGranularity, type Granularity };

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
  group?: string;
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
  const options = useMemo(
    () => (["day", "week", "month"] as const).map((g) => ({ value: g, label: labels[g] })),
    [labels],
  );
  return (
    <SegmentedControl value={value} onChange={onChange} options={options} label={labels.group} />
  );
}
