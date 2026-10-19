import "server-only";

// Diagnoses a drop in views the way the website's reach-drop guide does it:
// first make sure the drop is real (posts, total, median and average views,
// compared over two periods of the same length), then check the changes that
// usually explain one — format mix, posting rhythm, posting time, links and
// questions, and the data and platform side. Each check is a hypothesis with
// its numbers, not a verdict on what the algorithm did.

import { db } from "./db";
import { Prisma } from "./generated/prisma";
import { buildFeature } from "./database/post-benchmarks-shared";
import { getAccountViewTotals } from "./user-insights-cache";
import {
  DEFAULT_TZ,
  computeBestTimeToPost,
  computeTextFeatureComparison,
  computeTopHours,
  getBaselineMedianViews,
  getDateString,
  getHour,
  getLengthBucket,
  hasLink,
  hasQuestion,
  percentChange,
} from "./analytics";
import {
  dateKeyToUtcDate,
  followerChangeBetween,
  followerQueryStart,
  shiftDateKey,
  snapshotDays,
  utcDateToKey,
} from "./followers";
import { MATURE_AGE_MS } from "./monthly-review";
import { MILESTONE_AGE_MS, MIN_TYPICAL_PEERS, readingAtAge, toGrowthPoints } from "./post-growth";
import { parseDateOnlyInTimeZone } from "./time-range";

/** Four whole weeks, so both periods hold every weekday equally often. */
export const DEFAULT_PERIOD_DAYS = 28;
/** A move this large, in percent, counts as a real change rather than noise. */
export const CHANGE_THRESHOLD_PCT = 20;
/** Total views must fall at least this much, in percent, to count as a drop. */
export const TOTAL_DROP_THRESHOLD_PCT = 15;
/** Below this many posts with settled views in a period, its medians are too unsteady to judge. */
export const MIN_POSTS_PER_PERIOD = 5;
/** A share moving this many percentage points counts as a shift in the mix. */
export const MIX_SHIFT_PP = 20;
/** The same, for the share of posts with a link or a question. */
export const FEATURE_SHIFT_PP = 15;
/** A post with at least this multiple of the comparison period's median views broke out. */
export const BREAKOUT_MULTIPLE = 2;
/** A run of this many days without posts is a break. */
export const BREAK_DAYS = 7;

// Posts are compared at this age when growth readings cover enough of both
// periods; lifetime views favour the older period, whose posts had longer.
const MATCHED_AGE = "48h";
const MIN_MATCHED_COVERAGE = 0.5;
// Link, question and best-hour effects are measured over this much history
// before the diagnosed period, so the drop itself can't make whatever it
// happened to coincide with look bad.
const HISTORY_DAYS = 180;
const STALE_SYNC_MS = 48 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PREVIEW_LENGTH = 120;
const EXAMPLE_COUNT = 3;

// Hours in the analytics timezone; night wraps past midnight.
const TIME_BLOCKS = [
  { key: "night", from: 23, to: 5 },
  { key: "morning", from: 5, to: 11 },
  { key: "afternoon", from: 11, to: 17 },
  { key: "evening", from: 17, to: 23 },
] as const;

const POST_SELECT = {
  id: true,
  text: true,
  timestamp: true,
  mediaType: true,
  permalink: true,
  views: true,
  likes: true,
  replies: true,
  reposts: true,
  quotes: true,
  shares: true,
  syncedAt: true,
} satisfies Prisma.PostSelect;

type DiagnosisPost = Prisma.PostGetPayload<{ select: typeof POST_SELECT }>;
type Range = { since: Date; until: Date };
type CheckStatus = "changed" | "stable" | "not_enough_data";

export type ReachDropVerdict =
  | "insufficient_data"
  | "no_drop"
  | "fewer_posts"
  | "fewer_breakouts"
  | "lower_typical_reach"
  | "no_single_cause";

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};
const sharePct = (part: number, whole: number) => (whole > 0 ? round((part / whole) * 100) : null);
const shiftPp = (a: number | null, b: number | null) =>
  a !== null && b !== null ? round(a - b) : null;
const signedPct = (pct: number | null) => (pct === null ? "n/a" : `${pct > 0 ? "+" : ""}${pct}%`);
const isDown = (pct: number | null, threshold: number) => pct !== null && pct <= -threshold;
const preview = (text: string) =>
  text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;
const daysBetween = (fromKey: string, toKey: string) =>
  Math.round(
    (dateKeyToUtcDate(toKey).getTime() - dateKeyToUtcDate(fromKey).getTime()) / MS_PER_DAY,
  );
// Views read before this age are still growing, so they say little about reach.
const isSettled = (post: DiagnosisPost) =>
  post.syncedAt.getTime() - post.timestamp.getTime() >= MATURE_AGE_MS;
const medianOfSettled = (posts: DiagnosisPost[]) => {
  const settled = posts.filter(isSettled);
  return settled.length > 0 ? getBaselineMedianViews(settled) : null;
};
const inRange = (post: DiagnosisPost, range: Range) =>
  post.timestamp >= range.since && post.timestamp <= range.until;

/** The window of the same length that ends just before `range` starts. */
export function precedingRange(range: Range): Range {
  const length = range.until.getTime() - range.since.getTime();
  const until = new Date(range.since.getTime() - 1);
  return { since: new Date(until.getTime() - length), until };
}

/**
 * The last four whole weeks ending at least three days ago — younger posts
 * are still collecting views — and the four weeks before them.
 */
export function defaultReachDropPeriods(now: Date, tz: string) {
  const lastKey = shiftDateKey(getDateString(new Date(now.getTime() - MATURE_AGE_MS), tz), -1);
  const firstKey = shiftDateKey(lastKey, -(DEFAULT_PERIOD_DAYS - 1));
  const diagnosed = {
    since: parseDateOnlyInTimeZone(firstKey, tz, false),
    until: parseDateOnlyInTimeZone(lastKey, tz, true),
  };
  return { diagnosed, comparison: precedingRange(diagnosed) };
}

function describeRange(range: Range, tz: string) {
  return {
    since: range.since.toISOString(),
    until: range.until.toISOString(),
    firstDay: getDateString(range.since, tz),
    lastDay: getDateString(range.until, tz),
    days: round((range.until.getTime() - range.since.getTime()) / MS_PER_DAY, 0),
  };
}

function viewStats(posts: DiagnosisPost[]) {
  const settled = posts.filter(isSettled);
  const total = settled.reduce((sum, p) => sum + p.views, 0);
  return {
    posts: posts.length,
    postsWithSettledViews: settled.length,
    totalViews: total,
    medianViews: settled.length > 0 ? getBaselineMedianViews(settled) : null,
    averageViews: settled.length > 0 ? Math.round(total / settled.length) : null,
  };
}

/** Each post's views on the chosen basis: lifetime, or interpolated at MATCHED_AGE. */
function perPostStats(views: number[], breakoutAt: number | null) {
  const total = views.reduce((sum, v) => sum + v, 0);
  return {
    posts: views.length,
    medianViews: views.length > 0 ? getBaselineMedianViews(views.map((v) => ({ views: v }))) : null,
    averageViews: views.length > 0 ? Math.round(total / views.length) : null,
    breakouts:
      breakoutAt !== null && breakoutAt > 0 ? views.filter((v) => v >= breakoutAt).length : 0,
  };
}

function mixBreakdown(
  diagnosed: DiagnosisPost[],
  comparison: DiagnosisPost[],
  keyOf: (post: DiagnosisPost) => string,
) {
  const group = (posts: DiagnosisPost[]) => {
    const map = new Map<string, DiagnosisPost[]>();
    for (const post of posts) {
      const key = keyOf(post);
      const list = map.get(key);
      if (list) list.push(post);
      else map.set(key, [post]);
    }
    return map;
  };
  const now = group(diagnosed);
  const before = group(comparison);
  return [...new Set([...now.keys(), ...before.keys()])]
    .map((key) => {
      const list = now.get(key) ?? [];
      const baseList = before.get(key) ?? [];
      const share = sharePct(list.length, diagnosed.length);
      const baseShare = sharePct(baseList.length, comparison.length);
      return {
        key,
        diagnosed: { posts: list.length, sharePct: share, medianViews: medianOfSettled(list) },
        comparison: {
          posts: baseList.length,
          sharePct: baseShare,
          medianViews: medianOfSettled(baseList),
        },
        shareChangePp: shiftPp(share, baseShare),
      };
    })
    .sort(
      (a, b) => b.diagnosed.posts - a.diagnosed.posts || b.comparison.posts - a.comparison.posts,
    );
}

type MixRow = ReturnType<typeof mixBreakdown>[number];

function largestShift(rows: MixRow[]): MixRow | null {
  let largest: MixRow | null = null;
  for (const row of rows) {
    if (Math.abs(row.shareChangePp ?? 0) > Math.abs(largest?.shareChangePp ?? 0)) largest = row;
  }
  return largest;
}

const describeShift = (label: string, row: MixRow) =>
  `${label} went from ${row.comparison.sharePct ?? 0}% to ${row.diagnosed.sharePct ?? 0}% of posts ` +
  `(median views ${row.comparison.medianViews ?? "n/a"} before, ${row.diagnosed.medianViews ?? "n/a"} now).`;

function rhythmOf(posts: DiagnosisPost[], range: Range, tz: string, lastPostBefore: Date | null) {
  const firstKey = getDateString(range.since, tz);
  const lastKey = getDateString(range.until, tz);
  const perDay = new Map<string, number>();
  for (const post of posts) {
    const key = getDateString(post.timestamp, tz);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  let longestGapDays = 0;
  let run = 0;
  for (let key = firstKey; key <= lastKey; key = shiftDateKey(key, 1)) {
    run = perDay.has(key) ? 0 : run + 1;
    longestGapDays = Math.max(longestGapDays, run);
  }
  const days = daysBetween(firstKey, lastKey) + 1;
  const multiPostDays = [...perDay.values()].filter((count) => count > 1).length;
  const first = posts[0];
  return {
    postsPerWeek: round((posts.length / days) * 7),
    activeDays: perDay.size,
    multiPostDaysSharePct: sharePct(multiPostDays, perDay.size),
    longestGapDays,
    // Days from the last post before the period to its first post.
    gapBeforeFirstPostDays:
      first && lastPostBefore
        ? daysBetween(getDateString(lastPostBefore, tz), getDateString(first.timestamp, tz))
        : null,
  };
}

function blockOf(hour: number): string {
  const block = TIME_BLOCKS.find(({ from, to }) =>
    from < to ? hour >= from && hour < to : hour >= from || hour < to,
  );
  return block!.key;
}

export async function buildReachDropDiagnosis(options: {
  account: { id: string; accessToken: string; syncState: { lastSyncedAt: Date } | null };
  timezone: string;
  /** The period to diagnose; defaults to the last four whole weeks ending three days ago. */
  diagnosed?: Range;
  /** The period to compare with; defaults to the window of the same length just before. */
  comparison?: Range;
  now?: Date;
}): Promise<{ error: string } | { diagnosis: Record<string, unknown> }> {
  const { account, timezone: tz } = options;
  const now = options.now ?? new Date();
  const defaults = defaultReachDropPeriods(now, tz);
  const diagnosedRange = options.diagnosed ?? defaults.diagnosed;
  const comparisonRange =
    options.comparison ??
    (options.diagnosed ? precedingRange(diagnosedRange) : defaults.comparison);
  if (comparisonRange.until >= diagnosedRange.since) {
    return { error: "The comparison period must end before the diagnosed period starts." };
  }

  const history = {
    since: new Date(diagnosedRange.since.getTime() - HISTORY_DAYS * MS_PER_DAY),
    until: new Date(diagnosedRange.since.getTime() - 1),
  };
  const ranges = [diagnosedRange, comparisonRange];
  const [rawPosts, followerRows, accountViews] = await Promise.all([
    db.post.findMany({
      where: {
        accountId: account.id,
        mediaType: { not: "REPOST_FACADE" },
        OR: [...ranges, history].map((r) => ({ timestamp: { gte: r.since, lte: r.until } })),
      },
      orderBy: { timestamp: "asc" },
      select: POST_SELECT,
    }),
    db.followerSnapshot.findMany({
      where: {
        accountId: account.id,
        OR: ranges.map((r) => {
          const keys = snapshotDays(r, now);
          return {
            date: { gte: followerQueryStart(keys.firstKey), lte: dateKeyToUtcDate(keys.lastKey) },
          };
        }),
      },
      orderBy: { date: "asc" },
      select: { date: true, followersCount: true },
    }),
    getAccountViewTotals(
      account,
      [
        { label: "the diagnosed period", ...diagnosedRange },
        { label: "the comparison period", ...comparisonRange },
      ],
      now,
    ),
  ]);

  const diagnosedPosts = rawPosts.filter((p) => inRange(p, diagnosedRange));
  const comparisonPosts = rawPosts.filter((p) => inRange(p, comparisonRange));
  const historyPosts = rawPosts.filter((p) => inRange(p, history) && isSettled(p));
  const lastPostBefore = (range: Range) =>
    rawPosts.findLast((p) => p.timestamp < range.since)?.timestamp ?? null;

  const ids = [...diagnosedPosts, ...comparisonPosts].map((p) => p.id);
  const snapshotRows =
    ids.length > 0
      ? await db.postMetricSnapshot.findMany({
          where: { postId: { in: ids } },
          orderBy: [{ postId: "asc" }, { capturedAt: "asc" }],
          select: {
            postId: true,
            capturedAt: true,
            views: true,
            likes: true,
            replies: true,
            reposts: true,
            quotes: true,
            shares: true,
          },
        })
      : [];
  const readingsByPost = new Map<string, typeof snapshotRows>();
  for (const row of snapshotRows) {
    const rows = readingsByPost.get(row.postId);
    if (rows) rows.push(row);
    else readingsByPost.set(row.postId, [row]);
  }
  const viewsAtMatchedAge = (post: DiagnosisPost) => {
    const rows = readingsByPost.get(post.id);
    if (!rows) return null;
    const reading = readingAtAge(
      toGrowthPoints(post.timestamp, rows),
      MILESTONE_AGE_MS[MATCHED_AGE],
    );
    return reading?.views ?? null;
  };

  // ── Is the drop real? ─────────────────────────────────────────────────
  const diagnosedStats = viewStats(diagnosedPosts);
  const comparisonStats = viewStats(comparisonPosts);
  const change = {
    posts: percentChange(diagnosedStats.posts, comparisonStats.posts),
    totalViews: percentChange(diagnosedStats.totalViews, comparisonStats.totalViews),
    medianViews: percentChange(diagnosedStats.medianViews, comparisonStats.medianViews),
    averageViews: percentChange(diagnosedStats.averageViews, comparisonStats.averageViews),
  };

  const matched = (posts: DiagnosisPost[]) =>
    posts.map(viewsAtMatchedAge).filter((v): v is number => v !== null);
  const diagnosedMatched = matched(diagnosedPosts);
  const comparisonMatched = matched(comparisonPosts);
  const coversEnough = (values: number[], posts: DiagnosisPost[]) =>
    values.length >= MIN_TYPICAL_PEERS && values.length >= posts.length * MIN_MATCHED_COVERAGE;
  const ageMatched =
    coversEnough(diagnosedMatched, diagnosedPosts) &&
    coversEnough(comparisonMatched, comparisonPosts);
  const lifetime = (posts: DiagnosisPost[]) => posts.filter(isSettled).map((p) => p.views);
  const diagnosedViews = ageMatched ? diagnosedMatched : lifetime(diagnosedPosts);
  const comparisonViews = ageMatched ? comparisonMatched : lifetime(comparisonPosts);
  const comparisonMedian = perPostStats(comparisonViews, null).medianViews;
  const breakoutAt = comparisonMedian !== null ? comparisonMedian * BREAKOUT_MULTIPLE : null;
  const perPostDiagnosed = perPostStats(diagnosedViews, breakoutAt);
  const perPostComparison = perPostStats(comparisonViews, breakoutAt);
  const perPostChange = {
    medianViews: percentChange(perPostDiagnosed.medianViews, perPostComparison.medianViews),
    averageViews: percentChange(perPostDiagnosed.averageViews, perPostComparison.averageViews),
  };

  const enoughPosts =
    diagnosedStats.postsWithSettledViews >= MIN_POSTS_PER_PERIOD &&
    comparisonStats.postsWithSettledViews >= MIN_POSTS_PER_PERIOD;
  const findings: ReachDropVerdict[] = [];
  if (enoughPosts) {
    const lowerTypical = isDown(perPostChange.medianViews, CHANGE_THRESHOLD_PCT);
    if (lowerTypical) findings.push("lower_typical_reach");
    if (
      !lowerTypical &&
      isDown(perPostChange.averageViews, CHANGE_THRESHOLD_PCT) &&
      perPostDiagnosed.breakouts < perPostComparison.breakouts
    ) {
      findings.push("fewer_breakouts");
    }
    if (isDown(change.posts, CHANGE_THRESHOLD_PCT)) findings.push("fewer_posts");
  }
  const totalDown = isDown(change.totalViews, TOTAL_DROP_THRESHOLD_PCT);
  const verdict: ReachDropVerdict = !enoughPosts
    ? "insufficient_data"
    : findings.includes("lower_typical_reach")
      ? "lower_typical_reach"
      : !totalDown
        ? "no_drop"
        : (findings[0] ?? "no_single_cause");

  const basisLabel = ageMatched ? `compared at ${MATCHED_AGE} old` : "by lifetime views";
  const explanations: Record<ReachDropVerdict, string> = {
    insufficient_data:
      `The diagnosed period has ${diagnosedStats.postsWithSettledViews} and the comparison period ${comparisonStats.postsWithSettledViews} posts with settled views; ` +
      `each needs at least ${MIN_POSTS_PER_PERIOD} for medians that mean anything. Widen the periods.`,
    lower_typical_reach:
      `The typical post reaches fewer people: median views per post changed ${signedPct(perPostChange.medianViews)} (${basisLabel}). ` +
      "Look at the checks marked changed.",
    fewer_breakouts:
      `The typical post held (median ${signedPct(perPostChange.medianViews)}, ${basisLabel}), but fewer posts broke out past ` +
      `${BREAKOUT_MULTIPLE}× the usual views (${perPostDiagnosed.breakouts} vs ${perPostComparison.breakouts}), ` +
      `pulling the average down ${signedPct(perPostChange.averageViews)}.`,
    fewer_posts:
      `Views per post held (median ${signedPct(perPostChange.medianViews)}, ${basisLabel}); total views changed ` +
      `${signedPct(change.totalViews)} because there were fewer posts (${diagnosedStats.posts} vs ${comparisonStats.posts}).`,
    no_drop:
      `Total views changed ${signedPct(change.totalViews)} and the typical post ${signedPct(perPostChange.medianViews)} ` +
      `(${basisLabel}); there is no drop to explain.`,
    no_single_cause:
      `Total views changed ${signedPct(change.totalViews)}, but posts, the typical post and breakouts each moved less than ` +
      `${CHANGE_THRESHOLD_PCT}%; several small shifts add up.` +
      (ageMatched
        ? " The comparison period's posts have also had longer to collect lifetime views."
        : ""),
  };

  // ── Five changes worth checking ───────────────────────────────────────
  const enoughForMix =
    diagnosedPosts.length >= MIN_POSTS_PER_PERIOD && comparisonPosts.length >= MIN_POSTS_PER_PERIOD;
  const notEnough = `Fewer than ${MIN_POSTS_PER_PERIOD} posts in a period.`;

  const byMediaType = mixBreakdown(diagnosedPosts, comparisonPosts, (p) => p.mediaType);
  const byLength = mixBreakdown(diagnosedPosts, comparisonPosts, (p) => getLengthBucket(p.text));
  const typeShift = largestShift(byMediaType);
  const lengthShift = largestShift(byLength);
  const mixShifts = [
    typeShift && { label: `Media type ${typeShift.key}`, row: typeShift },
    lengthShift && { label: `Length ${lengthShift.key} characters`, row: lengthShift },
  ].filter(
    (shift): shift is { label: string; row: MixRow } =>
      !!shift && Math.abs(shift.row.shareChangePp ?? 0) >= MIX_SHIFT_PP,
  );
  const formatMix = {
    check: "format_mix",
    status: (!enoughForMix
      ? "not_enough_data"
      : mixShifts.length > 0
        ? "changed"
        : "stable") as CheckStatus,
    summary: !enoughForMix
      ? notEnough
      : mixShifts.length > 0
        ? mixShifts.map((s) => describeShift(s.label, s.row)).join(" ")
        : `Media types and lengths each held within ${MIX_SHIFT_PP} points of their share.`,
    note: "Topic shifts don't show in these numbers; compare the example posts.",
    byMediaType,
    byLength,
  };

  const diagnosedRhythm = rhythmOf(
    diagnosedPosts,
    diagnosedRange,
    tz,
    lastPostBefore(diagnosedRange),
  );
  const comparisonRhythm = rhythmOf(
    comparisonPosts,
    comparisonRange,
    tz,
    lastPostBefore(comparisonRange),
  );
  const rhythmChanges: string[] = [];
  if (
    diagnosedRhythm.longestGapDays >= BREAK_DAYS &&
    comparisonRhythm.longestGapDays < BREAK_DAYS
  ) {
    rhythmChanges.push(
      `A ${diagnosedRhythm.longestGapDays}-day stretch without posts in the diagnosed period (longest before: ${comparisonRhythm.longestGapDays} days).`,
    );
  }
  if ((diagnosedRhythm.gapBeforeFirstPostDays ?? 0) >= BREAK_DAYS) {
    rhythmChanges.push(
      `The period's first post came ${diagnosedRhythm.gapBeforeFirstPostDays} days after the one before it.`,
    );
  }
  const burstShift = shiftPp(
    diagnosedRhythm.multiPostDaysSharePct,
    comparisonRhythm.multiPostDaysSharePct,
  );
  if (Math.abs(burstShift ?? 0) >= MIX_SHIFT_PP) {
    rhythmChanges.push(
      `Days with more than one post went from ${comparisonRhythm.multiPostDaysSharePct}% to ${diagnosedRhythm.multiPostDaysSharePct}% of posting days.`,
    );
  }
  const noPosts = diagnosedPosts.length === 0 && comparisonPosts.length === 0;
  const postingRhythm = {
    check: "posting_rhythm",
    status: (noPosts
      ? "not_enough_data"
      : rhythmChanges.length > 0
        ? "changed"
        : "stable") as CheckStatus,
    summary: noPosts
      ? "No posts in either period."
      : rhythmChanges.length > 0
        ? rhythmChanges.join(" ")
        : `No break of ${BREAK_DAYS}+ days and no shift between spread-out and bunched-up posting.`,
    diagnosed: diagnosedRhythm,
    comparison: comparisonRhythm,
  };

  const bestHours = computeTopHours(computeBestTimeToPost(historyPosts, tz));
  const inBestHours = (posts: DiagnosisPost[]) =>
    bestHours.length > 0
      ? sharePct(
          posts.filter((p) => bestHours.includes(getHour(p.timestamp, tz))).length,
          posts.length,
        )
      : null;
  const byTimeOfDay = mixBreakdown(diagnosedPosts, comparisonPosts, (p) =>
    blockOf(getHour(p.timestamp, tz)),
  );
  const timeShift = largestShift(byTimeOfDay);
  const bestHoursShare = {
    diagnosedSharePct: inBestHours(diagnosedPosts),
    comparisonSharePct: inBestHours(comparisonPosts),
  };
  const bestHoursShift = shiftPp(
    bestHoursShare.diagnosedSharePct,
    bestHoursShare.comparisonSharePct,
  );
  const timeChanges: string[] = [];
  if (timeShift && Math.abs(timeShift.shareChangePp ?? 0) >= MIX_SHIFT_PP) {
    timeChanges.push(describeShift(`Posting in the ${timeShift.key}`, timeShift));
  }
  if (isDown(bestHoursShift, MIX_SHIFT_PP)) {
    timeChanges.push(
      `Posts in the hours that did best before the diagnosed period (${bestHours.join(", ")}) went from ` +
        `${bestHoursShare.comparisonSharePct}% to ${bestHoursShare.diagnosedSharePct}%.`,
    );
  }
  const postingTime = {
    check: "posting_time",
    status: (!enoughForMix
      ? "not_enough_data"
      : timeChanges.length > 0
        ? "changed"
        : "stable") as CheckStatus,
    summary: !enoughForMix
      ? notEnough
      : timeChanges.length > 0
        ? timeChanges.join(" ")
        : `Posting times held within ${MIX_SHIFT_PP} points across the day.`,
    timeOfDayHours: "night 23–5, morning 5–11, afternoon 11–17, evening 17–23",
    bestHours,
    inBestHours: bestHoursShare,
    byTimeOfDay,
  };

  const featureRows = computeTextFeatureComparison(historyPosts).map(
    ({ feature, withFeature, withoutFeature }) => {
      const test = feature === "link" ? hasLink : hasQuestion;
      const share = (posts: DiagnosisPost[]) =>
        sharePct(posts.filter((p) => test(p.text)).length, posts.length);
      const diagnosedShare = share(diagnosedPosts);
      const comparisonShare = share(comparisonPosts);
      const effect = buildFeature(
        feature,
        withFeature.medianViews,
        withoutFeature.medianViews,
        withFeature.postCount,
      );
      return {
        feature,
        diagnosedSharePct: diagnosedShare,
        comparisonSharePct: comparisonShare,
        shareChangePp: shiftPp(diagnosedShare, comparisonShare),
        history: {
          postsWith: effect.withCount,
          medianViewsWith: effect.withMedian,
          medianViewsWithout: effect.withoutMedian,
          // Null when too few posts have the feature for a fair comparison.
          medianViewsDiffPct: effect.deltaPct,
        },
      };
    },
  );
  const featureChanges = featureRows
    .filter((row) => Math.abs(row.shareChangePp ?? 0) >= FEATURE_SHIFT_PP)
    .map((row) => {
      const noun = row.feature === "link" ? "links" : "a question";
      const effect =
        row.history.medianViewsDiffPct === null
          ? `too few posts before the diagnosed period had ${noun} to say how they usually do.`
          : `in the ${HISTORY_DAYS} days before the diagnosed period, posts with ${noun} had ${Math.abs(row.history.medianViewsDiffPct)}% ` +
            `${row.history.medianViewsDiffPct < 0 ? "lower" : "higher"} median views than posts without.`;
      return `Posts with ${noun} went from ${row.comparisonSharePct}% to ${row.diagnosedSharePct}%; ${effect}`;
    });
  const linksAndQuestions = {
    check: "links_and_questions",
    status: (!enoughForMix
      ? "not_enough_data"
      : featureChanges.length > 0
        ? "changed"
        : "stable") as CheckStatus,
    summary: !enoughForMix
      ? notEnough
      : featureChanges.length > 0
        ? featureChanges.join(" ")
        : `The share of posts with links and with questions each held within ${FEATURE_SHIFT_PP} points.`,
    features: featureRows,
  };

  const followerSnapshots = followerRows.map((s) => ({
    date: utcDateToKey(s.date),
    followers: s.followersCount,
  }));
  // Snapshot days are counted in DEFAULT_TZ, up to today at most.
  const today = getDateString(now, DEFAULT_TZ);
  const followersIn = (range: Range) => {
    const { firstKey, lastKey } = snapshotDays(range, now);
    const coveredLastKey = [lastKey, today].sort()[0]!;
    const followers = followerChangeBetween(followerSnapshots, firstKey, lastKey);
    return {
      net: followers.net,
      snapshotDays: followers.inRange.length,
      expectedDays: Math.max(0, daysBetween(firstKey, coveredLastKey) + 1),
    };
  };
  const diagnosedFollowers = followersIn(diagnosedRange);
  const comparisonFollowers = followersIn(comparisonRange);
  const lastSyncedAt = account.syncState?.lastSyncedAt ?? null;
  const dataIssues: string[] = [];
  if (!lastSyncedAt) {
    dataIssues.push("This account has never finished a sync.");
  } else if (now.getTime() - lastSyncedAt.getTime() > STALE_SYNC_MS) {
    dataIssues.push(
      `The last sync was ${round((now.getTime() - lastSyncedAt.getTime()) / MS_PER_DAY)} days ago, so the latest numbers are out of date.`,
    );
  }
  for (const [label, followers] of [
    ["diagnosed", diagnosedFollowers],
    ["comparison", comparisonFollowers],
  ] as const) {
    if (followers.snapshotDays < followers.expectedDays) {
      dataIssues.push(
        `Follower snapshots exist for ${followers.snapshotDays} of ${followers.expectedDays} days in the ${label} period; ` +
          "the dashboard didn't sync on the others, so early growth readings from those days are missing.",
      );
    }
  }
  const dataAndPlatform = {
    check: "data_and_platform",
    status: (dataIssues.length > 0 ? "changed" : "stable") as CheckStatus,
    summary:
      dataIssues.length > 0 ? dataIssues.join(" ") : "Syncs ran on every day of both periods.",
    reminder:
      "Numbers can't show a restriction or a platform-wide change: check the account status in Threads settings " +
      "and Threads' announcements, especially when no other check explains the drop.",
    lastSyncedAt: lastSyncedAt?.toISOString() ?? null,
    accountViews: {
      diagnosed: accountViews.totals[0],
      comparison: accountViews.totals[1],
      changePct: percentChange(accountViews.totals[0], accountViews.totals[1]),
    },
    followers: { diagnosed: diagnosedFollowers, comparison: comparisonFollowers },
  };

  // ── Examples and caveats ──────────────────────────────────────────────
  const examples = (posts: DiagnosisPost[]) => {
    const byViews = posts.filter(isSettled).sort((a, b) => b.views - a.views);
    const top = byViews.slice(0, EXAMPLE_COUNT);
    const topIds = new Set(top.map((p) => p.id));
    const describe = (post: DiagnosisPost) => ({
      id: post.id,
      date: getDateString(post.timestamp, tz),
      mediaType: post.mediaType,
      text: preview(post.text),
      views: post.views,
      vsComparisonMedian:
        comparisonStats.medianViews && comparisonStats.medianViews > 0
          ? round(post.views / comparisonStats.medianViews)
          : null,
    });
    return {
      top: top.map(describe),
      bottom: byViews
        .filter((p) => !topIds.has(p.id))
        .slice(-EXAMPLE_COUNT)
        .reverse()
        .map(describe),
    };
  };

  const notes: string[] = [];
  const unsettled =
    diagnosedStats.posts -
    diagnosedStats.postsWithSettledViews +
    (comparisonStats.posts - comparisonStats.postsWithSettledViews);
  if (unsettled > 0) {
    notes.push(
      `${unsettled} post(s) were under 72 hours old at their last sync; they count as posts but are left out of the view numbers.`,
    );
  }
  if (!ageMatched) {
    notes.push(
      `Growth readings at ${MATCHED_AGE} cover too few posts to compare both periods at the same age, so per-post numbers ` +
        "use lifetime views, which favour the older comparison period.",
    );
  }
  const diagnosedDays = describeRange(diagnosedRange, tz).days;
  const comparisonDays = describeRange(comparisonRange, tz).days;
  if (diagnosedDays !== comparisonDays) {
    notes.push(
      `The periods differ in length (${diagnosedDays} vs ${comparisonDays} days), so compare per-post numbers rather than totals.`,
    );
  }
  if (accountViews.warning) notes.push(accountViews.warning);

  return {
    diagnosis: {
      timezone: tz,
      periods: {
        diagnosed: describeRange(diagnosedRange, tz),
        comparison: describeRange(comparisonRange, tz),
      },
      verdict,
      explanation: explanations[verdict],
      findings,
      summary: {
        diagnosed: diagnosedStats,
        comparison: comparisonStats,
        changePct: change,
      },
      perPost: {
        basis: ageMatched ? `views_at_${MATCHED_AGE}` : "lifetime_views",
        breakoutThreshold: breakoutAt,
        diagnosed: perPostDiagnosed,
        comparison: perPostComparison,
        changePct: perPostChange,
        postsWithGrowthReadings: {
          diagnosed: diagnosedMatched.length,
          comparison: comparisonMatched.length,
        },
      },
      checks: [formatMix, postingRhythm, postingTime, linksAndQuestions, dataAndPlatform],
      examples: { diagnosed: examples(diagnosedPosts), comparison: examples(comparisonPosts) },
      thresholds: {
        changePct: CHANGE_THRESHOLD_PCT,
        totalDropPct: TOTAL_DROP_THRESHOLD_PCT,
        minPostsPerPeriod: MIN_POSTS_PER_PERIOD,
        mixShiftPp: MIX_SHIFT_PP,
        featureShiftPp: FEATURE_SHIFT_PP,
        breakoutMultiple: BREAKOUT_MULTIPLE,
        breakDays: BREAK_DAYS,
      },
      dataQuality: { notes },
    },
  };
}
