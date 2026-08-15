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
}

export interface FollowerGrowthSummary {
  current: number;
  net: number;
  netPct: number | null;
  avgPerDay: number;
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

export function computeFollowerTrend(snapshots: FollowerSnapshotRow[]): FollowerTrendPoint[] {
  const sorted = [...snapshots].sort((a, b) => a.date.getTime() - b.date.getTime());
  return sorted.map((snapshot, i) => {
    const prev = sorted[i - 1];
    return {
      date: utcDateToKey(snapshot.date),
      followers: snapshot.followersCount,
      change: prev ? snapshot.followersCount - prev.followersCount : null,
    };
  });
}

export function summarizeFollowerGrowth(trend: FollowerTrendPoint[]): FollowerGrowthSummary | null {
  if (trend.length === 0) return null;
  const first = trend[0]!;
  const last = trend[trend.length - 1]!;
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
    // A single snapshot has no elapsed time to average over.
    avgPerDay: trend.length > 1 ? Math.round((net / elapsedDays) * 10) / 10 : 0,
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
