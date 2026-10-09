// Decides when a sync re-reads a post's insights and records them as a
// PostMetricSnapshot. Kept dependency-free so the test suite can exercise it
// directly with Node's type stripping, outside of Next.
//
// Recording every sync would let a short custom interval (down to a minute)
// write thousands of rows per post, so readings are spaced by the post's age:
// dense while it is young — the first hours decide how far a post travels —
// and sparse once its growth flattens. Whatever the sync interval, a post ends
// up with fewer than 120 rows (about 90 with hourly syncs). Insights requests
// follow the same spacing, since a reading between two recorded ones would
// only nudge the running totals.

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Posts are recorded, and their insights re-read, until this age. */
export const SNAPSHOT_WINDOW_MS = 30 * DAY_MS;

/** Spacing between retries for a post past the window that never got a
 *  non-zero reading, so one failed read can't leave it at zero for good. */
export const ZERO_METRICS_RETRY_MS = DAY_MS;

/** Minimum spacing between two readings of one post, by the post's age at
 *  the time of the reading. Ordered by age; the last tier ends the window. */
export const SNAPSHOT_SPACING: readonly { untilAgeMs: number; minGapMs: number }[] = [
  { untilAgeMs: 6 * HOUR_MS, minGapMs: 15 * MINUTE_MS },
  { untilAgeMs: 2 * DAY_MS, minGapMs: HOUR_MS },
  { untilAgeMs: 7 * DAY_MS, minGapMs: 6 * HOUR_MS },
  { untilAgeMs: SNAPSHOT_WINDOW_MS, minGapMs: DAY_MS },
];

// A reading up to 10% early still counts, so a sync running on the same
// interval as the spacing (hourly, daily) can't skip a turn because it reached
// the post a little sooner than last time — or, on Vercel Hobby, because the
// daily cron fired earlier in its hour than the day before.
const EARLY_TOLERANCE_RATIO = 0.1;

/**
 * Whether a post published at `postedAt`, last recorded at `lastCapturedAt`
 * (null when never), should be recorded by a reading taken at `now`.
 */
export function isPostSnapshotDue(
  postedAt: Date,
  lastCapturedAt: Date | null | undefined,
  now: Date,
): boolean {
  // A post timestamp slightly ahead of the server clock is a fresh post, not
  // one outside the window.
  const ageMs = Math.max(0, now.getTime() - postedAt.getTime());
  const tier = SNAPSHOT_SPACING.find((t) => ageMs < t.untilAgeMs);
  if (!tier) return false;
  if (!lastCapturedAt) return true;

  return now.getTime() - lastCapturedAt.getTime() >= tier.minGapMs * (1 - EARLY_TOLERANCE_RATIO);
}

/**
 * Whether a sync should request the insights of a post (or thread part)
 * published at `postedAt` whose insights were last read at `lastReadAt`.
 * Inside the window this follows the snapshot spacing; past it, metrics have
 * settled and only a post still at zero is retried.
 */
export function isInsightsReadDue(
  postedAt: Date,
  lastReadAt: Date | null | undefined,
  hasMetrics: boolean,
  now: Date,
): boolean {
  if (hasMetrics) return isPostSnapshotDue(postedAt, lastReadAt, now);
  if (now.getTime() - postedAt.getTime() < SNAPSHOT_WINDOW_MS) return true;
  return !lastReadAt || now.getTime() - lastReadAt.getTime() >= ZERO_METRICS_RETRY_MS;
}
