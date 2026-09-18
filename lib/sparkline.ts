import { getDateString, getMedian } from "@/lib/analytics";
import { bucketStart, defaultGranularity, type Granularity } from "@/lib/granularity";

function utcDate(key: string): Date {
  return new Date(`${key}T00:00:00Z`);
}

function listDays(since: Date, until: Date, tz: string): string[] {
  const first = utcDate(getDateString(since, tz));
  const last = utcDate(getDateString(until, tz));
  const days: string[] = [];
  for (let d = new Date(first); d <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// Days with no data are 0 so the x-axis is calendar time, not "days that had posts".
export function bucketSeries(
  points: Array<{ date: Date | string; value: number }>,
  since: Date,
  until: Date,
  tz: string,
): { values: number[]; granularity: Granularity } {
  const days = listDays(since, until, tz);
  const granularity = defaultGranularity(days.length);
  const perDay = new Map<string, number>();
  for (const point of points) {
    const key =
      typeof point.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(point.date)
        ? point.date
        : getDateString(new Date(point.date), tz);
    perDay.set(key, (perDay.get(key) ?? 0) + point.value);
  }
  const buckets = new Map<string, number>();
  for (const day of days) {
    const key = bucketStart(day, granularity);
    buckets.set(key, (buckets.get(key) ?? 0) + (perDay.get(day) ?? 0));
  }
  return { values: [...buckets.values()], granularity };
}

// Daily buckets take a trailing window; a single day rarely has enough posts for a median.
export function medianSeries(
  posts: Array<{ date: Date | string; views: number }>,
  since: Date,
  until: Date,
  tz: string,
  windowDays = 14,
): number[] {
  const days = listDays(since, until, tz);
  const granularity = defaultGranularity(days.length);
  const byDay = new Map<string, number[]>();
  for (const post of posts) {
    const key =
      typeof post.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(post.date)
        ? post.date
        : getDateString(new Date(post.date), tz);
    (byDay.get(key) ?? byDay.set(key, []).get(key)!).push(post.views);
  }

  const buckets: string[] = [];
  const bucketDays = new Map<string, string[]>();
  for (const day of days) {
    const key = bucketStart(day, granularity);
    if (!bucketDays.has(key)) {
      buckets.push(key);
      bucketDays.set(key, []);
    }
    bucketDays.get(key)!.push(day);
  }

  const values: Array<number | null> = buckets.map((key, index) => {
    const own = bucketDays.get(key)!;
    const span =
      granularity === "day" ? days.slice(Math.max(0, index - windowDays + 1), index + 1) : own;
    // Same population as getBaselineMedianViews: unsynced zero-view posts are excluded.
    const sample = span.flatMap((day) => byDay.get(day) ?? []).filter((views) => views > 0);
    return sample.length ? getMedian(sample) : null;
  });

  // Gaps repeat the neighbouring value rather than dropping to zero.
  let last: number | null = null;
  const filled = values.map((v) => (v === null ? last : (last = v)));
  const firstKnown = filled.find((v) => v !== null) ?? 0;
  return filled.map((v) => v ?? firstKnown);
}

// Daily post-level series are zeros with spikes on publish days; a week-wide mean gives the shape.
export function smoothSeries(values: number[], granularity: Granularity, window = 7): number[] {
  if (granularity !== "day" || values.length <= window) return values;
  const half = Math.floor(window / 2);
  return values.map((_, i) => {
    const start = Math.max(0, i - half);
    const end = Math.min(values.length, i + half + 1);
    let sum = 0;
    for (let j = start; j < end; j++) sum += values[j]!;
    return sum / (end - start);
  });
}

export function ratioSeries(numerator: number[], denominator: number[]): number[] {
  return numerator.map((n, i) => {
    const d = denominator[i] ?? 0;
    return d > 0 ? (n / d) * 100 : 0;
  });
}
