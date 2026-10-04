// Reads how posts grew from their PostMetricSnapshot rows: each metric's value
// a given time after publishing, so posts of different ages can be compared on
// equal terms. Kept dependency-free so the test suite can exercise it directly
// with Node's type stripping, outside of Next.

const HOUR_MS = 60 * 60 * 1000;

export const MILESTONE_KEYS = ["1h", "3h", "6h", "12h", "24h", "48h", "7d"] as const;
export type MilestoneKey = (typeof MILESTONE_KEYS)[number];

export const MILESTONE_AGE_MS: Record<MilestoneKey, number> = {
  "1h": HOUR_MS,
  "3h": 3 * HOUR_MS,
  "6h": 6 * HOUR_MS,
  "12h": 12 * HOUR_MS,
  "24h": 24 * HOUR_MS,
  "48h": 48 * HOUR_MS,
  "7d": 7 * 24 * HOUR_MS,
};

export const POST_METRICS = ["views", "likes", "replies", "reposts", "quotes", "shares"] as const;
export type PostMetric = (typeof POST_METRICS)[number];
export type MetricReading = Record<PostMetric, number>;

/** Engagement excludes shares, matching the app-wide rate (see getMetricRates). */
export const GROWTH_METRICS = [...POST_METRICS, "engagement"] as const;
export type GrowthMetric = (typeof GROWTH_METRICS)[number];

export interface GrowthPoint extends MetricReading {
  ageMs: number;
}

export function metricValue(reading: MetricReading, metric: GrowthMetric): number {
  if (metric === "engagement") {
    return reading.likes + reading.replies + reading.reposts + reading.quotes;
  }
  return reading[metric];
}

/** Snapshot rows as readings by age, youngest first. */
export function toGrowthPoints(
  postedAt: Date,
  snapshots: readonly (MetricReading & { capturedAt: Date })[],
): GrowthPoint[] {
  return snapshots
    .map((s) => ({
      // A post timestamp slightly ahead of the server clock reads as age 0.
      ageMs: Math.max(0, s.capturedAt.getTime() - postedAt.getTime()),
      views: s.views,
      likes: s.likes,
      replies: s.replies,
      reposts: s.reposts,
      quotes: s.quotes,
      shares: s.shares,
    }))
    .sort((a, b) => a.ageMs - b.ageMs);
}

const ZERO_READING: GrowthPoint = {
  ageMs: 0,
  views: 0,
  likes: 0,
  replies: 0,
  reposts: 0,
  quotes: 0,
  shares: 0,
};

// Two readings further apart than this, around the age asked for, are too
// coarse to estimate it from. Hourly syncs cover every milestone; six-hourly
// ones cover 12h and later, and daily ones 48h and 7d.
const MAX_SPAN_RATIO = 0.6;
const MIN_MAX_SPAN_MS = 2 * HOUR_MS;

/**
 * The post's metrics exactly `ageMs` after publishing, interpolated linearly
 * between the readings either side of that age. Every metric is 0 at
 * publication, which stands in for a reading at age 0. Null when the post
 * hasn't been read past that age, or the readings around it are too far apart
 * — e.g. tracking began long after the post went up.
 */
export function readingAtAge(points: readonly GrowthPoint[], ageMs: number): MetricReading | null {
  let before = ZERO_READING;
  for (const point of points) {
    if (point.ageMs < ageMs) {
      before = point;
      continue;
    }
    const span = point.ageMs - before.ageMs;
    if (span > Math.max(ageMs * MAX_SPAN_RATIO, MIN_MAX_SPAN_MS)) return null;
    const t = span === 0 ? 1 : (ageMs - before.ageMs) / span;
    const reading = {} as MetricReading;
    for (const metric of POST_METRICS) {
      reading[metric] = Math.round(before[metric] + (point[metric] - before[metric]) * t);
    }
    return reading;
  }
  return null;
}

export function milestoneReadings(
  points: readonly GrowthPoint[],
): Record<MilestoneKey, MetricReading | null> {
  const readings = {} as Record<MilestoneKey, MetricReading | null>;
  for (const key of MILESTONE_KEYS) readings[key] = readingAtAge(points, MILESTONE_AGE_MS[key]);
  return readings;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** `value` as a multiple of `baseline`, or null when there is no usable baseline. */
function ratio(value: number, baseline: number | null): number | null {
  if (baseline === null || baseline <= 0) return null;
  return Math.round((value / baseline) * 100) / 100;
}

export interface GrowthPost {
  id: string;
  postedAt: Date;
  points: GrowthPoint[];
}

export interface RankedGrowth {
  id: string;
  value: number;
  vsMedian: number | null;
  milestones: Record<MilestoneKey, number | null>;
}

export interface InProgressGrowth {
  id: string;
  /** Age of the post's latest reading, which the comparison is made at. */
  readingAgeMs: number;
  value: number;
  /** Median of the other posts at that same age. */
  medianAtSameAge: number | null;
  comparedWith: number;
  vsMedian: number | null;
}

export interface GrowthComparison {
  medians: Record<MilestoneKey, number | null>;
  /** Posts with a value at the milestone, highest first. */
  ranked: RankedGrowth[];
  /** Posts not yet old enough for the milestone, judged at their current age. */
  inProgress: InProgressGrowth[];
  /** Posts old enough for the milestone whose readings don't cover it. */
  uncovered: number;
}

/**
 * Ranks posts by `metric` at `milestone` against the median at that age, and
 * judges posts too young for the milestone against the others at whatever age
 * their latest reading was taken — the early read on whether a new post is
 * running ahead of the account's usual pace.
 */
export function compareGrowth(
  posts: readonly GrowthPost[],
  { milestone, metric, now }: { milestone: MilestoneKey; metric: GrowthMetric; now: Date },
): GrowthComparison {
  const rows = posts.map((post) => {
    const readings = milestoneReadings(post.points);
    const milestones = {} as Record<MilestoneKey, number | null>;
    for (const key of MILESTONE_KEYS) {
      const reading = readings[key];
      milestones[key] = reading ? metricValue(reading, metric) : null;
    }
    return { post, milestones, ageMs: now.getTime() - post.postedAt.getTime() };
  });

  const medians = {} as Record<MilestoneKey, number | null>;
  for (const key of MILESTONE_KEYS) {
    medians[key] = median(
      rows.flatMap((r) => (r.milestones[key] === null ? [] : [r.milestones[key]])),
    );
  }

  const ranked: RankedGrowth[] = [];
  const inProgress: InProgressGrowth[] = [];
  let uncovered = 0;

  for (const row of rows) {
    const value = row.milestones[milestone];
    if (value !== null) {
      ranked.push({
        id: row.post.id,
        value,
        vsMedian: ratio(value, medians[milestone]),
        milestones: row.milestones,
      });
      continue;
    }

    const latest = row.post.points.at(-1);
    if (row.ageMs >= MILESTONE_AGE_MS[milestone] || !latest) {
      uncovered++;
      continue;
    }

    const peers = rows.flatMap((other) => {
      if (other === row) return [];
      const reading = readingAtAge(other.post.points, latest.ageMs);
      return reading ? [metricValue(reading, metric)] : [];
    });
    const current = metricValue(latest, metric);
    const medianAtSameAge = median(peers);
    inProgress.push({
      id: row.post.id,
      readingAgeMs: latest.ageMs,
      value: current,
      medianAtSameAge,
      comparedWith: peers.length,
      vsMedian: ratio(current, medianAtSameAge),
    });
  }

  ranked.sort((a, b) => b.value - a.value);
  inProgress.sort((a, b) => a.readingAgeMs - b.readingAgeMs);
  return { medians, ranked, inProgress, uncovered };
}
