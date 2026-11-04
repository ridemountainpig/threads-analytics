import { DEFAULT_TZ, getDateString } from "@/lib/analytics";
import {
  DEMOGRAPHIC_BREAKDOWNS,
  type DemographicBreakdown,
  type DemographicBreakdownData,
  type DemographicEntry,
  type FollowerDemographics,
} from "@/lib/threads-api";

export interface FollowerSnapshotRow {
  date: Date;
  followersCount: number;
}

export interface FollowerTrendPoint {
  /** Local calendar date the snapshot was taken on, as YYYY-MM-DD. */
  date: string;
  followers: number;
  /** Change against the previous snapshot; null for the first point. */
  change: number | null;
  /** Date of the snapshot `change` is measured from, when not the day before (missed syncs). */
  changeSince?: string;
}

export interface FollowerGrowthSummary {
  current: number;
  /** Null when only one snapshot covers the range, so there is no change to measure. */
  net: number | null;
  netPct: number | null;
  avgPerDay: number | null;
  /** Number of snapshots, i.e. days actually observed — not the range length. */
  days: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface DemographicSlice {
  key: string;
  value: number;
  /** Share of the breakdown's total, in percent (one decimal). */
  share: number;
  /** Baseline-snapshot figures; absent when there is nothing to compare against. */
  previousValue?: number;
  previousShare?: number;
  valueChange?: number;
  /** Share movement in percentage points, not percent of a percent. */
  shareChange?: number;
}

// Prisma maps @db.Date to a Date pinned at UTC midnight, so calendar dates are
// converted with the UTC accessors on both ends. Shifting them into a display
// time zone would move snapshots onto the wrong day.

export function dateKeyToUtcDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function utcDateToKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function shiftDateKey(key: string, days: number): string {
  return utcDateToKey(new Date(dateKeyToUtcDate(key).getTime() + days * MS_PER_DAY));
}

/** How far back to look for the snapshot a range opens on, when the day before it was missed. */
export const FOLLOWER_LOOKBACK_DAYS = 3;

/** How recent `until` must be for a range to count as running up to the request. */
const PRESENT_TOLERANCE_MS = 60_000;

/**
 * The snapshot days a range covers. Snapshot dates are DEFAULT_TZ calendar days
 * holding each day's closing count, so a day belongs to the range its close
 * falls in: the day `until` lands in only counts once `until` reaches that
 * day's end — or when the range runs to the present (until ≈ now, or a day not
 * over yet), whose snapshot is simply the latest sync. Adjacent ranges
 * therefore never share a day.
 */
export function snapshotDays(range: { since: Date; until: Date }, now = new Date()) {
  const untilKey = getDateString(range.until, DEFAULT_TZ);
  const reachesDayEnd = getDateString(new Date(range.until.getTime() + 1), DEFAULT_TZ) !== untilKey;
  // The tolerance covers a request whose "now" was read just before midnight.
  const runsToPresent =
    now.getTime() - range.until.getTime() < PRESENT_TOLERANCE_MS ||
    untilKey >= getDateString(now, DEFAULT_TZ);
  return {
    firstKey: getDateString(range.since, DEFAULT_TZ),
    lastKey: reachesDayEnd || runsToPresent ? untilKey : shiftDateKey(untilKey, -1),
  };
}

/** Lower bound for a snapshot query, so the range's opening snapshot is fetched too. */
export function followerQueryStart(firstKey: string): Date {
  return dateKeyToUtcDate(shiftDateKey(firstKey, -FOLLOWER_LOOKBACK_DAYS));
}

/**
 * The snapshots inside `firstKey`..`lastKey` and the one the range opens on.
 * Each snapshot holds its day's closing count, so a range opens on the day
 * before it; when that sync was missed, the latest snapshot in the lookback
 * window stands in. `points` must be sorted by date.
 */
function followerRangeWindow<T extends { date: string }>(
  points: T[],
  firstKey: string,
  lastKey: string,
) {
  const lookback = shiftDateKey(firstKey, -FOLLOWER_LOOKBACK_DAYS);
  return {
    inRange: points.filter((p) => p.date >= firstKey && p.date <= lastKey),
    opening: points.filter((p) => p.date >= lookback && p.date < firstKey).at(-1) ?? null,
  };
}

/**
 * Net follower change across `firstKey`..`lastKey`, measured from `start`: the
 * opening snapshot when there is one (`opening`), else the range's own first
 * snapshot, which leaves out any change before it. Null when only one snapshot
 * covers the range. `snapshots` must be sorted by date.
 */
export function followerChangeBetween<T extends { date: string; followers: number }>(
  snapshots: T[],
  firstKey: string,
  lastKey: string,
) {
  const { inRange, opening } = followerRangeWindow(snapshots, firstKey, lastKey);
  const start = opening ?? inRange[0] ?? null;
  const closing = inRange.at(-1) ?? null;
  const net = start && closing && start !== closing ? closing.followers - start.followers : null;
  return { inRange, opening, start, closing, net };
}

export function computeFollowerTrend(snapshots: FollowerSnapshotRow[]): FollowerTrendPoint[] {
  const sorted = [...snapshots].sort((a, b) => a.date.getTime() - b.date.getTime());
  return sorted.map((snapshot, i) => {
    const prev = sorted[i - 1];
    const date = utcDateToKey(snapshot.date);
    const prevDate = prev && utcDateToKey(prev.date);
    return {
      date,
      followers: snapshot.followersCount,
      change: prev ? snapshot.followersCount - prev.followersCount : null,
      ...(prevDate && prevDate !== shiftDateKey(date, -1) && { changeSince: prevDate }),
    };
  });
}

/**
 * The range's own trend plus the snapshot it opens on (see followerChangeBetween),
 * so the first day's change is measured against that opening count instead of dropped.
 */
export function computeFollowerRangeTrend(
  snapshots: FollowerSnapshotRow[],
  firstKey: string,
  lastKey: string,
): { trend: FollowerTrendPoint[]; opening: FollowerTrendPoint | null } {
  const { inRange, opening } = followerRangeWindow(
    computeFollowerTrend(snapshots),
    firstKey,
    lastKey,
  );
  const [first, ...rest] = inRange;
  if (!first) return { trend: [], opening: null };
  const head: FollowerTrendPoint = {
    date: first.date,
    followers: first.followers,
    change: opening ? first.followers - opening.followers : null,
    ...(opening && opening.date !== shiftDateKey(first.date, -1) && { changeSince: opening.date }),
  };
  return { trend: [head, ...rest], opening };
}

export interface PostOnDay {
  id: string;
  text: string;
  views: number;
}

export interface PostsOnDay {
  top: PostOnDay[];
  count: number;
}

// Keyed like the snapshots, so pass the zone they are bucketed in (DEFAULT_TZ), not the viewer's.
export function groupPostsByDay(
  posts: Array<{ id: string; text: string; views: number; timestamp: Date }>,
  tz: string,
  days: Iterable<string>,
  limit = 3,
): Record<string, PostsOnDay> {
  const wanted = new Set(days);
  const byDay = new Map<string, PostOnDay[]>();
  for (const post of posts) {
    const key = getDateString(post.timestamp, tz);
    if (!wanted.has(key)) continue;
    const list = byDay.get(key) ?? [];
    list.push({ id: post.id, text: post.text, views: post.views });
    byDay.set(key, list);
  }
  const result: Record<string, PostsOnDay> = {};
  for (const [key, list] of byDay) {
    list.sort((a, b) => b.views - a.views);
    result[key] = { top: list.slice(0, limit), count: list.length };
  }
  return result;
}

/** `opening` is the snapshot the range opens on, from computeFollowerRangeTrend. */
export function summarizeFollowerGrowth(
  trend: FollowerTrendPoint[],
  opening: FollowerTrendPoint | null = null,
): FollowerGrowthSummary | null {
  if (trend.length === 0) return null;
  const first = opening ?? trend[0]!;
  const last = trend[trend.length - 1]!;
  // A single snapshot has no elapsed time to measure a change over.
  if (first === last) {
    return { current: last.followers, net: null, netPct: null, avgPerDay: null, days: 1 };
  }
  const net = last.followers - first.followers;
  // Divide by the calendar days actually elapsed, not by the number of
  // snapshots: syncs get missed, and counting intervals instead of days would
  // report growth over 11 days as if it happened in one.
  const elapsedDays = Math.max(
    1,
    Math.round(
      (dateKeyToUtcDate(last.date).getTime() - dateKeyToUtcDate(first.date).getTime()) / MS_PER_DAY,
    ),
  );
  return {
    current: last.followers,
    net,
    netPct: first.followers > 0 ? Math.round((net / first.followers) * 1000) / 10 : null,
    avgPerDay: Math.round((net / elapsedDays) * 10) / 10,
    days: trend.length,
  };
}

function isDemographicEntry(value: unknown): value is DemographicEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as DemographicEntry).key === "string" &&
    typeof (value as DemographicEntry).value === "number"
  );
}

const EMPTY_BREAKDOWN: DemographicBreakdownData = { total: 0, entries: [] };

/**
 * Validates the snapshot's Json column, which Prisma hands back untyped.
 *
 * Snapshots written before the breakdown gained an explicit `total` are stored
 * as a bare entry array; those are read back with the total summed from the
 * entries, which is the best that shape supports.
 */
export function parseDemographics(raw: unknown): FollowerDemographics | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const parsed = {} as FollowerDemographics;
  let hasAny = false;

  for (const breakdown of DEMOGRAPHIC_BREAKDOWNS) {
    const value = source[breakdown];
    const rawEntries = Array.isArray(value)
      ? value
      : typeof value === "object" &&
          value !== null &&
          Array.isArray((value as { entries?: unknown }).entries)
        ? (value as { entries: unknown[] }).entries
        : null;

    if (rawEntries === null) {
      parsed[breakdown] = EMPTY_BREAKDOWN;
      continue;
    }

    const entries = rawEntries.filter(isDemographicEntry);
    const storedTotal =
      !Array.isArray(value) && typeof (value as { total?: unknown }).total === "number"
        ? (value as { total: number }).total
        : null;
    const summed = entries.reduce((sum, entry) => sum + entry.value, 0);
    parsed[breakdown] = {
      // A stored total below the visible sum would make shares exceed 100%.
      total: storedTotal !== null ? Math.max(storedTotal, summed) : summed,
      entries,
    };
    if (entries.length > 0) hasAny = true;
  }

  return hasAny ? parsed : null;
}

function shareMap(data: DemographicBreakdownData): { total: number; shares: Map<string, number> } {
  const shares = new Map<string, number>();
  if (data.total > 0) {
    for (const entry of data.entries) {
      shares.set(entry.key, (entry.value / data.total) * 100);
    }
  }
  return { total: data.total, shares };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Ranks the current breakdown by size and, when a baseline snapshot exists,
 * annotates each row with how it moved. Both a head-count delta and a
 * percentage-point delta are reported because they routinely disagree: while the
 * account grows, nearly every bucket gains followers even as its share falls.
 */
export function compareDemographics(
  current: DemographicBreakdownData,
  baseline: DemographicBreakdownData | null,
  limit = 10,
): DemographicSlice[] {
  const { total, shares } = shareMap(current);
  if (total === 0) return [];
  // A baseline breakdown with no entries means that day's fetch didn't cover
  // this dimension — not that every bucket was empty. Comparing against it
  // would report each row as having gained its entire share out of nowhere.
  const usableBaseline = baseline && baseline.entries.length > 0 ? baseline : null;
  const base = usableBaseline ? shareMap(usableBaseline) : null;
  const baseValues = new Map(
    usableBaseline?.entries.map((entry) => [entry.key, entry.value]) ?? [],
  );

  return [...current.entries]
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((entry) => {
      // Deltas are derived from the unrounded shares on both sides; rounding
      // first would let this disagree with the trend chart by a tenth.
      const rawShare = shares.get(entry.key) ?? 0;
      const share = round1(rawShare);
      if (!base) {
        return { key: entry.key, value: entry.value, share };
      }
      // A key absent from the baseline is treated as having been zero, which is
      // what "it wasn't there before" means for both deltas.
      const previousValue = baseValues.get(entry.key) ?? 0;
      const previousShare = base.shares.get(entry.key) ?? 0;
      return {
        key: entry.key,
        value: entry.value,
        share,
        previousValue,
        previousShare: round1(previousShare),
        valueChange: entry.value - previousValue,
        shareChange: round1(rawShare - previousShare),
      };
    });
}

export interface DemographicTrendResult {
  /** Series keys, ordered by how far they moved; empty when there is nothing to compare. */
  keys: string[];
  /** Recharts rows: { date, [key]: percentage-point change vs the baseline }. */
  rows: Array<Record<string, string | number>>;
}

/**
 * Plots each key's share as a change in percentage points from the first
 * snapshot, rather than as the share itself. Composition moves by fractions of a
 * point per day, so absolute shares render as flat parallel lines; re-basing at
 * zero is what makes the divergence visible.
 */
export function computeDemographicTrend(
  snapshots: Array<{ date: Date; demographics: unknown }>,
  breakdown: DemographicBreakdown,
  limit = 5,
): DemographicTrendResult {
  const parsed = snapshots
    .map((snapshot) => ({
      date: utcDateToKey(snapshot.date),
      data: parseDemographics(snapshot.demographics)?.[breakdown] ?? EMPTY_BREAKDOWN,
    }))
    .filter((snapshot) => snapshot.data.entries.length > 0);

  if (parsed.length < 2) return { keys: [], rows: [] };

  const baseline = shareMap(parsed[0]!.data).shares;
  const perDate = parsed.map((snapshot) => ({
    date: snapshot.date,
    shares: shareMap(snapshot.data).shares,
  }));
  const latest = perDate[perDate.length - 1]!.shares;

  const candidates = new Set<string>([...baseline.keys(), ...latest.keys()]);
  const keys = [...candidates]
    .map((key) => ({ key, moved: Math.abs((latest.get(key) ?? 0) - (baseline.get(key) ?? 0)) }))
    // Anything that rounds to 0.0pp would be drawn flat on top of the zero
    // reference line, which reads as a bug rather than as "this didn't move".
    .filter((candidate) => candidate.moved >= 0.05)
    .sort((a, b) => b.moved - a.moved)
    .slice(0, limit)
    .map((candidate) => candidate.key);

  if (keys.length === 0) return { keys: [], rows: [] };

  const rows = perDate.map(({ date, shares }) => {
    const row: Record<string, string | number> = { date };
    for (const key of keys) {
      row[key] = round1((shares.get(key) ?? 0) - (baseline.get(key) ?? 0));
    }
    return row;
  });

  return { keys, rows };
}

export function hasDemographicData(
  demographics: FollowerDemographics | null,
): demographics is FollowerDemographics {
  if (!demographics) return false;
  return DEMOGRAPHIC_BREAKDOWNS.some((breakdown) => demographics[breakdown].entries.length > 0);
}

export type { DemographicBreakdown, FollowerDemographics };
