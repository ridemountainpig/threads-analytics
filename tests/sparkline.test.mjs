import assert from "node:assert/strict";
import test from "node:test";
import { bucketSeries, medianSeries } from "../lib/sparkline.ts";

const TZ = "Asia/Taipei";
const HOUR = 60 * 60_000;

/** A wall clock reading in Taipei (UTC+8, no DST). */
const tpe = (iso) => new Date(Date.parse(`${iso}Z`) - 8 * HOUR);

// Wednesday 3 June to Wednesday 30 September 2026: 120 days, so weekly buckets,
// with five days of the first week and three of the last in range.
const since = tpe("2026-06-03T00:00:00");
const until = tpe("2026-09-30T23:59:59.999");

test("sparklines drop the edge weeks the range only partly covers", () => {
  const points = [
    { date: "2026-06-03", value: 5 },
    { date: "2026-06-08", value: 2 },
    { date: tpe("2026-09-30T12:00:00"), value: 7 },
  ];
  const { values, granularity } = bucketSeries(points, since, until, TZ);
  assert.equal(granularity, "week");
  // The sixteen whole weeks from 8 June to 21 September.
  assert.deepEqual(values, [2, ...Array(15).fill(0)]);
});

test("weekly medians leave out the partly covered edge weeks too", () => {
  const posts = [
    { date: "2026-06-03", views: 1000 },
    { date: "2026-06-08", views: 100 },
    { date: "2026-06-15", views: 300 },
  ];
  const values = medianSeries(posts, since, until, TZ);
  assert.equal(values.length, 16);
  // Weeks without posts repeat the last median.
  assert.deepEqual(values.slice(0, 3), [100, 300, 300]);
});

test("a month is whole once the range reaches its last day, February included", () => {
  const points = [
    { date: "2025-01-20", value: 9 },
    { date: "2026-02-28", value: 4 },
  ];
  const { values, granularity } = bucketSeries(
    points,
    tpe("2025-01-15T00:00:00"),
    tpe("2026-02-28T23:59:59.999"),
    TZ,
  );
  assert.equal(granularity, "month");
  // February 2025 to February 2026; the second half of January 2025 is dropped.
  assert.equal(values.length, 13);
  assert.equal(values[0], 0);
  assert.equal(values.at(-1), 4);
});

test("daily sparklines keep every day of the range", () => {
  const { values, granularity } = bucketSeries(
    [{ date: "2026-10-01", value: 3 }],
    tpe("2026-10-01T00:00:00"),
    tpe("2026-10-07T23:59:59.999"),
    TZ,
  );
  assert.equal(granularity, "day");
  assert.deepEqual(values, [3, 0, 0, 0, 0, 0, 0]);
});
