import "server-only";

import { db } from "./db";
import { Prisma } from "./generated/prisma";
import { DEMOGRAPHIC_BREAKDOWNS } from "./threads-api";
import { getAccountViewTotals } from "./user-insights-cache";
import {
  DEFAULT_TZ,
  getBaselineMedianViews,
  getDateString,
  getLengthBucket,
  getPercentile,
  percentChange,
  ratePct,
} from "./analytics";
import {
  compareDemographics,
  dateKeyToUtcDate,
  followerChangeBetween,
  followerQueryStart,
  groupPostsByDay,
  parseDemographics,
  shiftDateKey,
  snapshotDays,
  utcDateToKey,
} from "./followers";
import { buildRetentionBenchmark } from "./thread-part-kind";
import { parseDateOnlyInTimeZone } from "./time-range";

export const REVIEW_METRICS = [
  "postsCount",
  "activeDays",
  "accountViews",
  "newPostViews",
  "medianViews",
  "p75Views",
  "hitRate",
  "engagementRate",
  "replyRate",
  "repostRate",
  "shareRate",
  "followersNet",
  "followersPer1kViews",
  "threadCount",
  "part2Retention",
  "longestGapDays",
] as const;

export type ReviewMetric = (typeof REVIEW_METRICS)[number];
type MonthKpis = Record<ReviewMetric, number | null>;

export interface ReviewExperiment {
  metric: ReviewMetric;
  direction: "up" | "down";
  target?: number;
  label?: string;
}

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
// A post's reach mostly lands in its first few days; younger ones are still growing.
const MATURE_AGE_MS = 72 * 60 * 60 * 1000;
const FLAT_THRESHOLD_PCT = 5;
const PREVIEW_LENGTH = 120;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

type ReviewPost = Prisma.PostGetPayload<{ select: typeof POST_SELECT }> & { date: string };
type Part2 = { text: string; views: number };
type Snapshot = { date: string; followers: number };

const pad = (n: number) => String(n).padStart(2, "0");
const round = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};
const sum = (posts: ReviewPost[], pick: (p: ReviewPost) => number) =>
  posts.reduce((total, p) => total + pick(p), 0);
const preview = (text: string) =>
  text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;
const isMature = (post: ReviewPost) =>
  post.syncedAt.getTime() - post.timestamp.getTime() >= MATURE_AGE_MS;

function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split("-").map(Number);
  return new Date(Date.UTC(year, mon - 1 + delta, 1)).toISOString().slice(0, 7);
}

function daysInMonth(month: string): number {
  const [year, mon] = month.split("-").map(Number);
  return new Date(Date.UTC(year, mon, 0)).getUTCDate();
}

const lastDayKey = (month: string) => `${month}-${pad(daysInMonth(month))}`;

function monthRange(month: string, tz: string) {
  return {
    since: parseDateOnlyInTimeZone(`${month}-01`, tz, false),
    until: parseDateOnlyInTimeZone(lastDayKey(month), tz, true),
  };
}

export function lastCompleteMonth(now: Date, tz: string): string {
  return shiftMonth(getDateString(now, tz).slice(0, 7), -1);
}

function longestGapDays(month: string, activeDates: Set<string>, elapsedDays: number) {
  let longest = 0;
  let run = 0;
  for (let day = 1; day <= elapsedDays; day++) {
    if (activeDates.has(`${month}-${pad(day)}`)) {
      run = 0;
    } else {
      run += 1;
      longest = Math.max(longest, run);
    }
  }
  return longest;
}

function computeMonthKpis(input: {
  month: string;
  posts: ReviewPost[];
  part2ByRoot: Map<string, Part2>;
  followersNet: number | null;
  accountViews: number | null;
  referenceMedian: number;
  elapsedDays: number;
}): MonthKpis {
  const { month, posts, part2ByRoot, referenceMedian, followersNet } = input;
  const views = sum(posts, (p) => p.views);
  const engagement = sum(posts, (p) => p.likes + p.replies + p.reposts + p.quotes);
  const hasPosts = posts.length > 0;
  const threads = posts.filter((p) => part2ByRoot.has(p.id));
  const retention = buildRetentionBenchmark(
    threads.map((p) => ({ ...part2ByRoot.get(p.id)!, rootViews: p.views })),
  );
  const activeDates = new Set(posts.map((p) => p.date));

  return {
    postsCount: posts.length,
    activeDays: activeDates.size,
    accountViews: input.accountViews,
    newPostViews: views,
    medianViews: hasPosts ? getBaselineMedianViews(posts) : null,
    p75Views: hasPosts
      ? getPercentile(
          posts.map((p) => p.views).filter((v) => v > 0),
          0.75,
        )
      : null,
    hitRate:
      hasPosts && referenceMedian > 0
        ? round((posts.filter((p) => p.views >= referenceMedian).length / posts.length) * 100, 1)
        : null,
    engagementRate: ratePct(engagement, views),
    replyRate: ratePct(
      sum(posts, (p) => p.replies),
      views,
    ),
    repostRate: ratePct(
      sum(posts, (p) => p.reposts),
      views,
    ),
    shareRate: ratePct(
      sum(posts, (p) => p.shares),
      views,
    ),
    followersNet,
    followersPer1kViews:
      followersNet !== null && input.accountViews
        ? round((followersNet / input.accountViews) * 1000, 2)
        : null,
    threadCount: threads.length,
    part2Retention: retention.median,
    longestGapDays: longestGapDays(month, activeDates, input.elapsedDays),
  };
}

function average(values: Array<number | null>): number | null {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return null;
  return round(present.reduce((a, b) => a + b, 0) / present.length, 2);
}

function judgeExperiment(
  experiment: ReviewExperiment,
  baselineValue: number | null,
  actual: number | null,
): "hit" | "miss" | "flat" | "no_data" {
  if (actual === null) return "no_data";
  const up = experiment.direction === "up";
  if (experiment.target !== undefined) {
    return (up ? actual >= experiment.target : actual <= experiment.target) ? "hit" : "miss";
  }
  if (baselineValue === null) return "no_data";
  if (baselineValue === 0) {
    if (actual === 0) return "flat";
    return actual > 0 === up ? "hit" : "miss";
  }
  const change = ((actual - baselineValue) / Math.abs(baselineValue)) * 100;
  if (Math.abs(change) < FLAT_THRESHOLD_PCT) return "flat";
  return change > 0 === up ? "hit" : "miss";
}

function breakdown(
  posts: ReviewPost[],
  baselinePosts: ReviewPost[],
  keyOf: (post: ReviewPost) => string,
) {
  const group = (list: ReviewPost[]) => {
    const map = new Map<string, ReviewPost[]>();
    for (const post of list) {
      const key = keyOf(post);
      const group = map.get(key);
      if (group) group.push(post);
      else map.set(key, [post]);
    }
    return map;
  };
  const current = group(posts);
  const base = group(baselinePosts);
  return [...new Set([...current.keys(), ...base.keys()])]
    .map((key) => {
      const list = current.get(key) ?? [];
      const baseList = base.get(key) ?? [];
      return {
        key,
        posts: list.length,
        sharePct: posts.length > 0 ? round((list.length / posts.length) * 100, 1) : 0,
        medianViews: list.length > 0 ? getBaselineMedianViews(list) : null,
        baselineSharePct:
          baselinePosts.length > 0
            ? round((baseList.length / baselinePosts.length) * 100, 1)
            : null,
        baselineMedianViews: baseList.length > 0 ? getBaselineMedianViews(baseList) : null,
      };
    })
    .sort((a, b) => b.posts - a.posts || (b.baselineSharePct ?? 0) - (a.baselineSharePct ?? 0));
}

function demographicsShift(
  opening: { date: Date; demographics: unknown } | null,
  closing: { date: Date; demographics: unknown } | null,
) {
  if (!opening || !closing || opening.date.getTime() === closing.date.getTime()) return null;
  const before = parseDemographics(opening.demographics);
  const after = parseDemographics(closing.demographics);
  if (!before || !after) return null;
  const shift: Record<string, unknown> = {
    from: utcDateToKey(opening.date),
    to: utcDateToKey(closing.date),
  };
  for (const breakdownKey of DEMOGRAPHIC_BREAKDOWNS) {
    shift[breakdownKey] = compareDemographics(after[breakdownKey], before[breakdownKey], 5).map(
      (slice) => ({
        key: slice.key,
        share: slice.share,
        shareChange: slice.shareChange ?? null,
        valueChange: slice.valueChange ?? null,
      }),
    );
  }
  return shift;
}

export async function buildMonthlyReview(options: {
  account: { id: string; accessToken: string; syncState: { lastSyncedAt: Date } | null };
  month?: string;
  compareMonth?: string;
  timezone: string;
  baselineMonths: number;
  experiments?: ReviewExperiment[];
  now?: Date;
}): Promise<{ error: string } | { review: Record<string, unknown> }> {
  const { account, timezone: tz, baselineMonths } = options;
  const now = options.now ?? new Date();
  const currentMonth = getDateString(now, tz).slice(0, 7);
  const month = options.month ?? lastCompleteMonth(now, tz);
  if (!MONTH_PATTERN.test(month)) return { error: `Invalid month "${month}"; use YYYY-MM.` };
  if (month > currentMonth) return { error: `${month} is in the future.` };

  const oldest = await db.post.findFirst({
    where: { accountId: account.id, mediaType: { not: "REPOST_FACADE" } },
    orderBy: { timestamp: "asc" },
    select: { timestamp: true },
  });
  if (!oldest) return { error: "No posts have been synced for this account yet." };
  const firstMonth = getDateString(oldest.timestamp, tz).slice(0, 7);
  if (month < firstMonth) {
    return { error: `The earliest post is from ${firstMonth}; pick ${firstMonth} or later.` };
  }

  const prevMonth = shiftMonth(month, -1);
  const compareMonth = options.compareMonth ?? prevMonth;
  if (options.compareMonth !== undefined) {
    if (!MONTH_PATTERN.test(compareMonth)) {
      return { error: `Invalid compare_month "${compareMonth}"; use YYYY-MM.` };
    }
    if (compareMonth >= month) return { error: "compare_month must be earlier than month." };
    if (compareMonth < firstMonth) {
      return {
        error: `The earliest post is from ${firstMonth}; compare_month must be ${firstMonth} or later.`,
      };
    }
  }
  const baseline = Array.from({ length: baselineMonths }, (_, i) =>
    shiftMonth(month, i - baselineMonths),
  ).filter((m) => m >= firstMonth);
  const months = [...new Set([...baseline, compareMonth, month])]
    .filter((m) => m >= firstMonth)
    .sort();
  const isComplete = month < currentMonth;
  const monthDays = daysInMonth(month);
  const elapsedDays = isComplete ? monthDays : Number(getDateString(now, tz).slice(8, 10));

  const target = monthRange(month, tz);
  const { firstKey, lastKey } = snapshotDays(target, now);
  // Contiguous months share one range, so a distant compare_month skips the months between.
  const blocks: Array<{ since: Date; until: Date }> = [];
  months.forEach((m, i) => {
    const range = monthRange(m, tz);
    if (i > 0 && months[i - 1] === shiftMonth(m, -1))
      blocks[blocks.length - 1]!.until = range.until;
    else blocks.push(range);
  });
  const timestampInBlocks = blocks.map((b) => ({ timestamp: { gte: b.since, lte: b.until } }));
  const demographicsWhere = { accountId: account.id, demographics: { not: Prisma.AnyNull } };
  const demographicsSelect = { date: true, demographics: true } as const;

  const [rawPosts, part2Rows, snapshotRows, openingDemo, closingDemo, accountViews] =
    await Promise.all([
      db.post.findMany({
        where: {
          accountId: account.id,
          mediaType: { not: "REPOST_FACADE" },
          OR: timestampInBlocks,
        },
        orderBy: { timestamp: "asc" },
        select: POST_SELECT,
      }),
      db.threadReply.findMany({
        where: {
          accountId: account.id,
          position: 2,
          rootPost: { OR: timestampInBlocks },
        },
        orderBy: { timestamp: "asc" },
        select: { rootPostId: true, text: true, views: true },
      }),
      db.followerSnapshot.findMany({
        where: {
          accountId: account.id,
          OR: blocks.map((b) => {
            const keys = snapshotDays(b, now);
            return {
              date: { gte: followerQueryStart(keys.firstKey), lte: dateKeyToUtcDate(keys.lastKey) },
            };
          }),
        },
        orderBy: { date: "asc" },
        select: { date: true, followersCount: true },
      }),
      db.followerSnapshot.findFirst({
        where: {
          ...demographicsWhere,
          date: {
            gte: followerQueryStart(firstKey),
            lte: dateKeyToUtcDate(lastKey),
          },
        },
        orderBy: { date: "asc" },
        select: demographicsSelect,
      }),
      db.followerSnapshot.findFirst({
        where: {
          ...demographicsWhere,
          date: { gte: dateKeyToUtcDate(firstKey), lte: dateKeyToUtcDate(lastKey) },
        },
        orderBy: { date: "desc" },
        select: demographicsSelect,
      }),
      getAccountViewTotals(
        account,
        months.map((m) => ({ label: m, ...monthRange(m, tz) })),
        now,
      ),
    ]);

  const posts: ReviewPost[] = rawPosts.map((p) => ({ ...p, date: getDateString(p.timestamp, tz) }));
  const postsByMonth = new Map<string, ReviewPost[]>(months.map((m) => [m, []]));
  for (const post of posts) postsByMonth.get(post.date.slice(0, 7))?.push(post);

  // Replying to the root twice leaves two parts at position 2; the earlier one is the thread's.
  const part2ByRoot = new Map<string, Part2>();
  for (const row of part2Rows) {
    if (!part2ByRoot.has(row.rootPostId)) {
      part2ByRoot.set(row.rootPostId, { text: row.text, views: row.views });
    }
  }

  const snapshots: Snapshot[] = snapshotRows.map((s) => ({
    date: utcDateToKey(s.date),
    followers: s.followersCount,
  }));

  const monthPosts = postsByMonth.get(month)!;
  const baselinePosts = baseline.flatMap((m) => postsByMonth.get(m)!);
  const referenceMedian = getBaselineMedianViews(
    baselinePosts.length > 0 ? baselinePosts : monthPosts,
  );

  const followersNetFor = (m: string) => {
    const keys = snapshotDays(monthRange(m, tz), now);
    return followerChangeBetween(snapshots, keys.firstKey, keys.lastKey).net;
  };
  const kpisFor = (m: string) =>
    computeMonthKpis({
      month: m,
      posts: postsByMonth.get(m)!,
      part2ByRoot,
      followersNet: followersNetFor(m),
      accountViews: accountViews.totals[months.indexOf(m)],
      referenceMedian,
      elapsedDays: m === month ? elapsedDays : daysInMonth(m),
    });
  const kpisByMonth = new Map(months.map((m) => [m, kpisFor(m)]));
  const current = kpisByMonth.get(month)!;
  const previous = kpisByMonth.get(prevMonth) ?? null;
  const comparison = kpisByMonth.get(compareMonth) ?? null;
  const baselineKpis = baseline.map((m) => kpisByMonth.get(m)!);

  const kpis = Object.fromEntries(
    REVIEW_METRICS.map((metric) => {
      const value = current[metric];
      const compareValue = comparison?.[metric] ?? null;
      const baselineAvg = average(baselineKpis.map((k) => k[metric]));
      return [
        metric,
        {
          value,
          compareValue,
          baselineAvg,
          vsComparePct: percentChange(value, compareValue),
          vsBaselinePct: percentChange(value, baselineAvg),
        },
      ];
    }),
  );

  const summarizePost = (post: ReviewPost) => ({
    id: post.id,
    date: post.date,
    mediaType: post.mediaType,
    text: preview(post.text),
    views: post.views,
    likes: post.likes,
    replies: post.replies,
    reposts: post.reposts,
    quotes: post.quotes,
    shares: post.shares,
    engagementRatePct: ratePct(post.likes + post.replies + post.reposts + post.quotes, post.views),
    vsBaselineMedian: referenceMedian > 0 ? round(post.views / referenceMedian, 1) : null,
    isThread: part2ByRoot.has(post.id),
    ...(!isMature(post) && { stillGrowing: true }),
    permalink: post.permalink,
  });
  const byViews = [...monthPosts].sort((a, b) => b.views - a.views);
  const topPosts = byViews.slice(0, 5);
  const topIds = new Set(topPosts.map((p) => p.id));
  const bottomPosts = byViews
    .filter((p) => isMature(p) && !topIds.has(p.id))
    .slice(-3)
    .reverse();

  const followers = followerChangeBetween(snapshots, firstKey, lastKey);
  // Only day-over-day changes count; a gap between snapshots would lump several days together.
  const topGainDays = snapshots
    .map((point, i) => ({ point, prev: snapshots[i - 1] }))
    .filter(
      ({ point, prev }) =>
        point.date >= firstKey &&
        point.date <= lastKey &&
        prev?.date === shiftDateKey(point.date, -1),
    )
    .map(({ point, prev }) => ({ date: point.date, gain: point.followers - prev!.followers }))
    .filter((day) => day.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 3)
    .map((day) => {
      const dayBefore = shiftDateKey(day.date, -1);
      const grouped = groupPostsByDay(posts, DEFAULT_TZ, [day.date, dayBefore]);
      const nearby = [day.date, dayBefore]
        .flatMap((date) => (grouped[date]?.top ?? []).map((p) => ({ ...p, date })))
        .sort((a, b) => b.views - a.views)
        .slice(0, 3)
        .map((p) => ({ id: p.id, date: p.date, text: preview(p.text), views: p.views }));
      return { ...day, posts: nearby };
    });

  const weekly = [];
  for (let start = 1; start <= elapsedDays; start += 7) {
    const end = Math.min(start + 6, elapsedDays);
    const list = monthPosts.filter((p) => {
      const day = Number(p.date.slice(8, 10));
      return day >= start && day <= end;
    });
    weekly.push({
      from: `${month}-${pad(start)}`,
      to: `${month}-${pad(end)}`,
      posts: list.length,
      newPostViews: sum(list, (p) => p.views),
      medianViews: list.length > 0 ? getBaselineMedianViews(list) : null,
    });
  }

  const threadPosts = monthPosts.filter((p) => part2ByRoot.has(p.id));
  const singlePosts = monthPosts.filter((p) => !part2ByRoot.has(p.id));
  const baselineThreads = baselinePosts.filter((p) => part2ByRoot.has(p.id));

  const immaturePosts = monthPosts.filter((p) => !isMature(p)).length;
  const notes: string[] = [];
  if (!isComplete) {
    notes.push(
      `${month} is still in progress (${elapsedDays} of ${monthDays} days), so counts and totals are not comparable to full months yet.`,
    );
  }
  if (immaturePosts > 0) {
    notes.push(
      `${immaturePosts} post(s) were under 72 hours old at their last sync; their numbers are still growing, so treat this month's views as a floor.`,
    );
  }
  if (baseline.length === 0) {
    notes.push(
      "There are no earlier months with posts, so there is no baseline; hit rate and vsBaselineMedian use this month's own median.",
    );
  } else if (baseline.length < baselineMonths) {
    notes.push(
      `Only ${baseline.length} of the requested ${baselineMonths} baseline months have posts.`,
    );
  }
  if (accountViews.warning) notes.push(accountViews.warning);
  // Snapshot days are counted in DEFAULT_TZ, up to today at most.
  const coveredLastKey = [lastKey, getDateString(now, DEFAULT_TZ)].sort()[0]!;
  const snapshotDaysExpected = Math.max(
    0,
    Math.round(
      (dateKeyToUtcDate(coveredLastKey).getTime() - dateKeyToUtcDate(firstKey).getTime()) /
        MS_PER_DAY,
    ) + 1,
  );
  if (followers.inRange.length < snapshotDaysExpected) {
    notes.push(
      `Follower snapshots exist for ${followers.inRange.length} of ${snapshotDaysExpected} days (one is written per day the dashboard syncs).`,
    );
  }
  if (!followers.opening && followers.start) {
    notes.push(
      `No snapshot exists from just before the month, so follower change is measured from ${followers.start.date}; any growth before that day is not included.`,
    );
  }

  const review: Record<string, unknown> = {
    month,
    timezone: tz,
    range: { since: target.since.toISOString(), until: target.until.toISOString() },
    compareMonth: comparison ? compareMonth : null,
    baselineMonths: baseline,
    dataQuality: {
      isComplete,
      daysCovered: elapsedDays,
      daysInMonth: monthDays,
      lastSyncedAt: account.syncState?.lastSyncedAt.toISOString() ?? null,
      immaturePosts,
      referenceMedianViews: referenceMedian,
      notes,
    },
    kpis,
  };
  if (options.experiments?.length) {
    review.experimentResults = options.experiments.map((experiment) => {
      const baselineValue = previous?.[experiment.metric] ?? null;
      const actual = current[experiment.metric];
      return {
        ...experiment,
        baselineValue,
        actual,
        changePct: percentChange(actual, baselineValue),
        result: judgeExperiment(experiment, baselineValue, actual),
      };
    });
  }
  Object.assign(review, {
    topPosts: topPosts.map(summarizePost),
    bottomPosts: bottomPosts.map(summarizePost),
    followers: {
      measuredFrom: followers.start,
      measuredTo: followers.closing,
      net: followers.net,
      per1kViews: current.followersPer1kViews,
      topGainDays,
    },
    contentMix: {
      byMediaType: breakdown(monthPosts, baselinePosts, (p) => p.mediaType),
      byLength: breakdown(monthPosts, baselinePosts, (p) => getLengthBucket(p.text)),
    },
    threads: {
      count: threadPosts.length,
      part2RetentionMedian: current.part2Retention,
      baselinePart2RetentionMedian: buildRetentionBenchmark(
        baselineThreads.map((p) => ({ ...part2ByRoot.get(p.id)!, rootViews: p.views })),
      ).median,
      threadMedianViews: threadPosts.length > 0 ? getBaselineMedianViews(threadPosts) : null,
      singlePostMedianViews: singlePosts.length > 0 ? getBaselineMedianViews(singlePosts) : null,
    },
    weekly,
    audienceShift: demographicsShift(openingDemo, closingDemo),
  });
  return { review };
}
