import assert from "node:assert/strict";
import test from "node:test";
import {
  isPostSnapshotDue,
  SNAPSHOT_SPACING,
  SNAPSHOT_WINDOW_MS,
} from "../lib/post-metric-snapshots.ts";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const postedAt = new Date("2026-10-01T00:00:00Z");
const at = (ms) => new Date(postedAt.getTime() + ms);

// Whether a reading at `ageMs` is due when the previous one was `sinceLastMs` earlier.
const dueAfter = (ageMs, sinceLastMs) =>
  isPostSnapshotDue(postedAt, at(ageMs - sinceLastMs), at(ageMs));

test("records the first reading of a post inside the window", () => {
  assert.equal(isPostSnapshotDue(postedAt, null, at(5 * MINUTE)), true);
  assert.equal(isPostSnapshotDue(postedAt, undefined, at(29 * DAY)), true);
});

test("stops recording once a post leaves the window", () => {
  assert.equal(isPostSnapshotDue(postedAt, null, at(SNAPSHOT_WINDOW_MS)), false);
  assert.equal(isPostSnapshotDue(postedAt, at(SNAPSHOT_WINDOW_MS - 2 * DAY), at(31 * DAY)), false);
});

test("treats a post timestamp ahead of the server clock as a fresh post", () => {
  assert.equal(isPostSnapshotDue(postedAt, null, at(-30_000)), true);
});

test("spaces readings by the post's age", () => {
  // First six hours: every 15 minutes.
  assert.equal(dueAfter(3 * HOUR, 10 * MINUTE), false);
  assert.equal(dueAfter(3 * HOUR, 15 * MINUTE), true);
  // Up to two days: hourly.
  assert.equal(dueAfter(24 * HOUR, 30 * MINUTE), false);
  assert.equal(dueAfter(24 * HOUR, HOUR), true);
  // Up to a week: every six hours.
  assert.equal(dueAfter(4 * DAY, 3 * HOUR), false);
  assert.equal(dueAfter(4 * DAY, 6 * HOUR), true);
  // Rest of the window: daily.
  assert.equal(dueAfter(10 * DAY, 12 * HOUR), false);
  assert.equal(dueAfter(10 * DAY, DAY), true);
});

test("accepts a reading up to 10% early", () => {
  assert.equal(dueAfter(3 * HOUR, 14 * MINUTE), true);
  assert.equal(dueAfter(3 * HOUR, 13 * MINUTE), false);
  assert.equal(dueAfter(24 * HOUR, 54 * MINUTE), true);
  assert.equal(dueAfter(24 * HOUR, 53 * MINUTE), false);
  // A Vercel Hobby daily cron can fire anywhere within its hour, so two days'
  // readings can be as little as 23 hours apart.
  assert.equal(dueAfter(10 * DAY, 23 * HOUR), true);
  assert.equal(dueAfter(10 * DAY, 21 * HOUR), false);
});

test("spacing tiers are ordered and end at the window", () => {
  for (let i = 1; i < SNAPSHOT_SPACING.length; i++) {
    assert.ok(SNAPSHOT_SPACING[i].untilAgeMs > SNAPSHOT_SPACING[i - 1].untilAgeMs);
  }
  assert.equal(SNAPSHOT_SPACING.at(-1).untilAgeMs, SNAPSHOT_WINDOW_MS);
});

test("keeps the rows per post bounded at any sync interval", () => {
  const rowsAt = (intervalMs) => {
    let last = null;
    let rows = 0;
    for (let age = 30_000; age < SNAPSHOT_WINDOW_MS + DAY; age += intervalMs) {
      if (isPostSnapshotDue(postedAt, last, at(age))) {
        last = at(age);
        rows++;
      }
    }
    return rows;
  };

  assert.ok(rowsAt(MINUTE) < 120, `1-minute syncs wrote ${rowsAt(MINUTE)} rows`);
  // An hourly sync records every run for the first two days.
  assert.ok(rowsAt(HOUR) >= 48, `hourly syncs wrote ${rowsAt(HOUR)} rows`);
  // A daily sync still records once a day across the whole window.
  assert.equal(rowsAt(DAY), 30);
});
