import assert from "node:assert/strict";
import test from "node:test";
import {
  computeBestTimeToPost,
  computeDailyPerformance,
  computeDayOfWeekPerformance,
  computeKeywordAnalysis,
  computePostingCalendar,
  computePostingConsistency,
  computePostingGapAnalysis,
  computePostingStreak,
  computeTopPostsByEngagementRate,
  computeViewsTrend,
  computeViralPosts,
  computeWeeklyFrequency,
  getBaselineMedianViews,
  getMedian,
  getPercentile,
  percentChange,
  ratePct,
} from "../lib/analytics.ts";

const HOUR = 60 * 60_000;

/** The instant a wall clock reading `iso` shows in a zone `offsetHours` from UTC. */
const local = (iso, offsetHours) => new Date(Date.parse(`${iso}Z`) - offsetHours * HOUR);

const post = (timestamp, fields = {}) => ({
  id: timestamp.toISOString(),
  text: "",
  timestamp,
  mediaType: "TEXT",
  permalink: "",
  views: 100,
  likes: 0,
  replies: 0,
  reposts: 0,
  quotes: 0,
  shares: 0,
  ...fields,
});

/** A wall clock reading in Taipei (UTC+8, no DST), the default analytics zone. */
const tpe = (iso) => local(iso, 8);

// Offsets in effect in early October 2026, after New Zealand's switch to DST.
const ZONES = [
  ["America/Los_Angeles", -7],
  ["UTC", 0],
  ["Asia/Taipei", 8],
  ["Pacific/Auckland", 13],
  ["Pacific/Kiritimati", 14],
];

test("a streak through yesterday stays current until a day is missed", () => {
  for (const [tz, offset] of ZONES) {
    const posts = ["03", "04", "05"].map((day) => post(local(`2026-10-${day}T10:00:00`, offset)));
    const now = local("2026-10-06T20:00:00", offset);
    // East of UTC+12, the walk used to start a day ahead and report 0.
    assert.equal(computePostingStreak(posts, tz, now).currentStreak, 3, tz);
  }
});

test("posting today extends the current streak", () => {
  for (const [tz, offset] of ZONES) {
    const posts = ["03", "04", "05", "06"].map((day) =>
      post(local(`2026-10-${day}T09:00:00`, offset)),
    );
    const now = local("2026-10-06T20:00:00", offset);
    assert.equal(computePostingStreak(posts, tz, now).currentStreak, 4, tz);
  }
});

test("a missed day ends the current streak but not the longest one", () => {
  const posts = ["01", "02", "03", "05"].map((day) => post(local(`2026-10-${day}T12:00:00`, 8)));
  const now = local("2026-10-06T08:00:00", 8);
  assert.deepEqual(computePostingStreak(posts, "Asia/Taipei", now), {
    longestStreak: 3,
    currentStreak: 1,
    totalDaysWithPosts: 4,
  });
  // Two missed days end it for good.
  const later = local("2026-10-07T08:00:00", 8);
  assert.equal(computePostingStreak(posts, "Asia/Taipei", later).currentStreak, 0);
});

test("posting days follow the analytics time zone", () => {
  // 23:30 and 00:30 in Taipei fall on two days there, but on one (15:30, 16:30) in UTC.
  const posts = [post(local("2026-10-04T23:30:00", 8)), post(local("2026-10-05T00:30:00", 8))];
  const now = local("2026-10-05T20:00:00", 8);
  assert.equal(computePostingStreak(posts, "Asia/Taipei", now).currentStreak, 2);
  assert.equal(computePostingStreak(posts, "UTC", now).totalDaysWithPosts, 1);
});

test("several posts on one day make one posting day", () => {
  const posts = ["08:00", "12:00", "22:00"].map((time) => post(local(`2026-10-05T${time}:00`, 8)));
  const now = local("2026-10-05T23:00:00", 8);
  assert.deepEqual(computePostingStreak(posts, "Asia/Taipei", now), {
    longestStreak: 1,
    currentStreak: 1,
    totalDaysWithPosts: 1,
  });
});

test("an account with no posts has no streak", () => {
  assert.deepEqual(computePostingStreak([], "Asia/Taipei", new Date("2026-10-06T00:00:00Z")), {
    longestStreak: 0,
    currentStreak: 0,
    totalDaysWithPosts: 0,
  });
});

test("medians and percentiles of view counts", () => {
  assert.equal(getMedian([]), 0);
  assert.equal(getMedian([5, 1, 3]), 3);
  // An even count averages the middle pair, rounded to a whole view.
  assert.equal(getMedian([10, 20]), 15);
  assert.equal(getMedian([4, 1, 3, 2]), 3);
  // Nearest rank: the smallest value with at least that share at or below it.
  assert.equal(getPercentile([], 0.75), 0);
  assert.equal(getPercentile([40, 10, 30, 20], 0.75), 30);
  assert.equal(getPercentile([40, 10, 30, 20], 0), 10);
  assert.equal(getPercentile([40, 10, 30, 20], 1), 40);
  // Posts without views yet don't drag the baseline down.
  assert.equal(getBaselineMedianViews([0, 0, 10, 30].map((views) => ({ views }))), 20);
});

test("rates and percent changes have no value without a positive base", () => {
  assert.equal(ratePct(1, 3), 33.33);
  assert.equal(ratePct(5, 0), null);
  assert.equal(percentChange(150, 100), 50);
  assert.equal(percentChange(1, 3), -66.7);
  assert.equal(percentChange(1, 3, 0), -67);
  assert.equal(percentChange(100, 0), null);
  assert.equal(percentChange(100, -5), null);
  assert.equal(percentChange(null, 100), null);
  assert.equal(percentChange(100, null), null);
});

test("hours and weekdays are read in the analytics time zone", () => {
  // Sunday 23:30 and Monday 00:15 in Taipei are both Sunday afternoon in UTC.
  const posts = [post(tpe("2026-10-04T23:30:00")), post(tpe("2026-10-05T00:15:00"))];
  const hours = (tz) => computeBestTimeToPost(posts, tz).map((point) => point.hour);
  assert.deepEqual(hours("Asia/Taipei"), [0, 23]);
  assert.deepEqual(hours("UTC"), [15, 16]);

  const days = (tz) =>
    computeDayOfWeekPerformance(posts, tz)
      .filter((point) => point.postCount > 0)
      .map((point) => [point.day, point.postCount]);
  assert.deepEqual(days("Asia/Taipei"), [
    ["Sun", 1],
    ["Mon", 1],
  ]);
  assert.deepEqual(days("UTC"), [["Sun", 2]]);
  assert.equal(computeDayOfWeekPerformance(posts, "UTC").length, 7);
});

test("weeks follow ISO numbering across the turn of the year", () => {
  // 2026 has 53 ISO weeks: Monday 28 Dec and Friday 1 Jan share 2026-W53, and
  // Monday 4 Jan starts 2027-W01.
  const posts = ["2026-12-28T12:00:00", "2027-01-01T12:00:00", "2027-01-04T12:00:00"].map((iso) =>
    post(tpe(iso)),
  );
  assert.deepEqual(
    computeWeeklyFrequency(posts, "Asia/Taipei").map((week) => [week.week, week.postCount]),
    [
      ["2026-W53", 2],
      ["2027-W01", 1],
    ],
  );
});

test("the views trend rolls weeks up into months past 16 weeks", () => {
  // One post every Monday from 5 Jan 2026, at noon in Taipei.
  const weekly = (count) =>
    Array.from({ length: count }, (_, i) => post(new Date(Date.UTC(2026, 0, 5 + 7 * i, 4))));
  assert.equal(computeViewsTrend(weekly(16), "Asia/Taipei").granularity, "week");

  const trend = computeViewsTrend(weekly(17), "Asia/Taipei");
  assert.equal(trend.granularity, "month");
  assert.deepEqual(
    trend.points.map((point) => [point.period, point.postCount]),
    [
      ["2026-01", 4],
      ["2026-02", 4],
      ["2026-03", 5],
      ["2026-04", 4],
    ],
  );
});

test("posting gaps count calendar days, not 24-hour spans", () => {
  const posts = [
    "2026-10-01T23:00:00",
    "2026-10-02T01:00:00", // two hours later, but the next day: "1"
    "2026-10-02T09:00:00", // same day: "0"
    "2026-10-05T23:00:00", // three days later: "2-3"
    "2026-10-20T08:00:00", // fifteen days later: "8+"
  ].map((iso) => post(tpe(iso)));
  assert.deepEqual(
    computePostingGapAnalysis(posts, "Asia/Taipei").map((point) => [point.gap, point.postCount]),
    [
      ["0", 1],
      ["1", 1],
      ["2-3", 1],
      ["8+", 1],
    ],
  );
  assert.deepEqual(computePostingGapAnalysis(posts.slice(0, 1), "Asia/Taipei"), []);
});

test("posting consistency counts every ISO week the range touches", () => {
  // Sunday to the following Saturday touches two ISO weeks.
  const since = tpe("2026-10-04T00:00:00");
  const until = tpe("2026-10-10T23:59:59.999");
  const posts = [post(tpe("2026-10-06T10:00:00"))];
  assert.deepEqual(computePostingConsistency(posts, since, until, "Asia/Taipei"), {
    totalWeeks: 2,
    weeksWithPosts: 1,
    percentage: 50,
  });
});

test("the posting calendar lists every day of the range in the analytics time zone", () => {
  const posts = [
    post(tpe("2026-10-02T00:30:00")), // still 1 October in UTC
    post(tpe("2026-10-02T20:00:00")),
    post(tpe("2026-10-04T09:00:00")),
  ];
  const since = tpe("2026-10-01T00:00:00");
  const until = tpe("2026-10-05T23:59:59.999");
  assert.deepEqual(computePostingCalendar(posts, since, until, undefined, "Asia/Taipei"), [
    { date: "2026-10-01", count: 0 },
    { date: "2026-10-02", count: 2 },
    { date: "2026-10-03", count: 0 },
    { date: "2026-10-04", count: 1 },
    { date: "2026-10-05", count: 0 },
  ]);
});

test("trimming the posting calendar keeps whole Sunday-to-Saturday weeks", () => {
  // Posts on Wednesday 7 and Tuesday 13 October keep Sunday 4 to Saturday 17.
  const posts = [post(tpe("2026-10-07T12:00:00")), post(tpe("2026-10-13T12:00:00"))];
  const days = computePostingCalendar(
    posts,
    tpe("2026-09-01T00:00:00"),
    tpe("2026-10-31T23:59:59.999"),
    { trimEmptyEdges: true },
    "Asia/Taipei",
  );
  assert.equal(days.length, 14);
  assert.equal(days[0].date, "2026-10-04");
  assert.equal(days.at(-1).date, "2026-10-17");
});

test("daily performance prefers profile views and weights the rolling rate by views", () => {
  const posts = [
    post(tpe("2026-10-01T10:00:00"), { views: 100, likes: 10 }),
    post(tpe("2026-10-02T10:00:00"), { views: 100, likes: 1 }),
  ];
  // Only the second day has a profile-level reading.
  const userViews = [{ end_time: tpe("2026-10-02T12:00:00").toISOString(), value: 900 }];
  const daily = computeDailyPerformance(posts, userViews, "Asia/Taipei");
  assert.deepEqual(
    daily.map((day) => [day.date, day.views, day.postViews, day.engagementRate]),
    [
      ["2026-10-01", 100, 100, 10],
      ["2026-10-02", 900, 100, 0.11],
    ],
  );
  // (10% × 100 + 0.11% × 900) / 1000 views, not the plain mean of 10 and 0.11.
  assert.equal(daily[1].rollingEngagementRate, 1.1);
});

test("viral posts beat twice the median and rank by multiplier", () => {
  const posts = [100, 100, 100, 100, 150, 250, 600].map((views, i) =>
    post(new Date(Date.UTC(2026, 9, i + 1)), { views }),
  );
  assert.deepEqual(
    computeViralPosts(posts).map((p) => [p.views, p.multiplier]),
    [
      [600, 6],
      [250, 2.5],
    ],
  );
  assert.deepEqual(computeViralPosts(posts.slice(0, 2)), []);
});

test("engagement-rate rankings leave out posts with too few views to judge", () => {
  const posts = [1000, 1000, 1000, 1000, 1000].map((views, i) =>
    post(new Date(Date.UTC(2026, 9, i + 1)), { views, likes: 10 * (i + 1) }),
  );
  // Half its views like it, but ten views is far below half the median.
  const fluke = post(new Date(Date.UTC(2026, 9, 10)), { views: 10, likes: 5 });
  const ranked = computeTopPostsByEngagementRate([...posts, fluke], 3);
  assert.deepEqual(
    ranked.map((p) => p.engRate),
    [5, 4, 3],
  );
});

test("keywords pool engagement across the posts that use them", () => {
  const at = tpe("2026-10-01T12:00:00");
  const posts = [
    post(at, { text: "Coffee notes #coffee https://example.com/latte", views: 100, likes: 10 }),
    post(at, { text: "more COFFEE and the 2026 plan", views: 300, likes: 6 }),
    post(at, { text: "@coffee says hi", views: 600 }),
  ];
  // Hashtags and mentions count as the bare word, case folded; a post counts once.
  assert.deepEqual(computeKeywordAnalysis(posts), [
    { word: "coffee", postCount: 3, avgViews: 333, avgEngagementRate: 1.6, avgShareRate: 0 },
  ]);
  // Links, stop words and numbers are not keywords.
  const words = computeKeywordAnalysis(posts, 1, 50).map((k) => k.word);
  for (const word of ["latte", "example", "https", "the", "and", "more", "2026"]) {
    assert.ok(!words.includes(word), word);
  }
  assert.ok(words.includes("plan"));
});
