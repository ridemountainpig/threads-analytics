import assert from "node:assert/strict";
import test from "node:test";
import {
  compareGrowth,
  metricValue,
  milestoneReadings,
  readingAtAge,
  toGrowthPoints,
} from "../lib/post-growth.ts";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const now = new Date("2026-10-04T12:00:00Z");
const ago = (ms) => new Date(now.getTime() - ms);

// A reading where every metric scales with views, so one number describes it.
const reading = (ageMs, views) => ({
  ageMs,
  views,
  likes: views / 10,
  replies: views / 100,
  reposts: 0,
  quotes: 0,
  shares: views / 100,
});

/** A post published `ageMs` ago, read at each [age, views] pair. */
const post = (id, ageMs, readings) => ({
  id,
  postedAt: ago(ageMs),
  points: readings.map(([age, views]) => reading(age, views)),
});

test("orders snapshot rows by age and clamps a timestamp ahead of the clock", () => {
  const postedAt = new Date("2026-10-04T10:00:00Z");
  const row = (iso, views) => ({
    capturedAt: new Date(iso),
    views,
    likes: 0,
    replies: 0,
    reposts: 0,
    quotes: 0,
    shares: 0,
  });
  const points = toGrowthPoints(postedAt, [
    row("2026-10-04T12:00:00Z", 200),
    row("2026-10-04T09:59:30Z", 0),
    row("2026-10-04T11:00:00Z", 100),
  ]);
  assert.deepEqual(
    points.map((p) => [p.ageMs, p.views]),
    [
      [0, 0],
      [HOUR, 100],
      [2 * HOUR, 200],
    ],
  );
});

test("interpolates between the readings either side of an age", () => {
  const points = [reading(2 * HOUR, 200), reading(4 * HOUR, 600)];
  assert.equal(readingAtAge(points, 3 * HOUR).views, 400);
  assert.equal(readingAtAge(points, 4 * HOUR).views, 600);
});

test("uses publication as a zero reading before the first snapshot", () => {
  const points = [reading(90 * MINUTE, 300)];
  assert.deepEqual(readingAtAge(points, HOUR), {
    views: 200,
    likes: 20,
    replies: 2,
    reposts: 0,
    quotes: 0,
    shares: 2,
  });
});

test("has no reading for an age the post hasn't been read past", () => {
  assert.equal(readingAtAge([reading(HOUR, 100)], 3 * HOUR), null);
  assert.equal(readingAtAge([], HOUR), null);
});

test("refuses to estimate across readings too far apart", () => {
  // Tracking began three days after the post went up.
  assert.equal(readingAtAge([reading(3 * DAY, 9000)], DAY), null);
  // Daily syncs: too coarse for 24h, fine for 48h.
  const daily = [reading(4 * HOUR, 100), reading(28 * HOUR, 900), reading(52 * HOUR, 1380)];
  assert.equal(readingAtAge(daily, DAY), null);
  assert.equal(readingAtAge(daily, 2 * DAY).views, 1300);
});

test("engagement counts likes, replies, reposts and quotes but not shares", () => {
  assert.equal(
    metricValue(
      { views: 100, likes: 5, replies: 3, reposts: 2, quotes: 1, shares: 9 },
      "engagement",
    ),
    11,
  );
});

test("reads every milestone a post's readings cover", () => {
  const hourly = Array.from({ length: 49 }, (_, h) => reading(h * HOUR + 10 * MINUTE, h * 100));
  const readings = milestoneReadings(hourly);
  assert.ok(readings["1h"]);
  assert.ok(readings["48h"]);
  assert.equal(readings["7d"], null);
});

test("ranks posts at a milestone against the median", () => {
  const hourlyTo = (lastHour, viewsPerHour) =>
    Array.from({ length: lastHour + 1 }, (_, h) => [h * HOUR, h * viewsPerHour]);
  const posts = [
    post("slow", 10 * DAY, hourlyTo(30, 10)),
    post("mid", 9 * DAY, hourlyTo(30, 20)),
    post("fast", 8 * DAY, hourlyTo(30, 60)),
  ];

  const result = compareGrowth(posts, { milestone: "24h", metric: "views", now });
  assert.deepEqual(
    result.ranked.map((r) => [r.id, r.value, r.vsMedian]),
    [
      ["fast", 1440, 3],
      ["mid", 480, 1],
      ["slow", 240, 0.5],
    ],
  );
  assert.equal(result.medians["24h"], 480);
  assert.equal(result.ranked[0].milestones["1h"], 60);
  assert.equal(result.uncovered, 0);
});

test("judges a post too young for the milestone at its current age", () => {
  const hourlyTo = (lastHour, viewsPerHour) =>
    Array.from({ length: lastHour + 1 }, (_, h) => [h * HOUR, h * viewsPerHour]);
  const posts = [
    post("a", 5 * DAY, hourlyTo(30, 10)),
    post("b", 4 * DAY, hourlyTo(30, 30)),
    post("new", 3 * HOUR, hourlyTo(3, 100)),
  ];

  const result = compareGrowth(posts, { milestone: "24h", metric: "views", now });
  assert.deepEqual(
    result.ranked.map((r) => r.id),
    ["b", "a"],
  );
  assert.deepEqual(result.inProgress, [
    {
      id: "new",
      readingAgeMs: 3 * HOUR,
      value: 300,
      medianAtSameAge: 60,
      comparedWith: 2,
      vsMedian: 5,
    },
  ]);
});

test("counts old posts whose readings don't reach the milestone as uncovered", () => {
  const posts = [
    // Tracked from day 20 only, so 24h was never observed.
    post("late", 25 * DAY, [
      [20 * DAY, 5000],
      [21 * DAY, 5100],
    ]),
    post("covered", 2 * DAY, [
      [23 * HOUR, 230],
      [25 * HOUR, 250],
    ]),
  ];
  const result = compareGrowth(posts, { milestone: "24h", metric: "views", now });
  assert.deepEqual(
    result.ranked.map((r) => [r.id, r.value]),
    [["covered", 240]],
  );
  assert.equal(result.inProgress.length, 0);
  assert.equal(result.uncovered, 1);
});
