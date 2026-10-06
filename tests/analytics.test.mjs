import assert from "node:assert/strict";
import test from "node:test";
import { computePostingStreak } from "../lib/analytics.ts";

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
