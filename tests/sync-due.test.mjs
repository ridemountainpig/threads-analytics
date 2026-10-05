import assert from "node:assert/strict";
import test from "node:test";
import { syncDueAt } from "../lib/sync-due.ts";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const SYNC_DURATION = 5_000;

const start = new Date("2026-10-04T00:00:00Z").getTime();

/**
 * Replays cron calls at `callTimes` (ms offsets) against a sync interval and
 * returns the offsets of the calls that synced. Like the real thing,
 * lastSyncedAt is stamped when the sync finishes.
 */
function replay(callTimes, intervalMinutes, options) {
  let lastSyncedAt = null;
  const synced = [];
  for (const offset of callTimes) {
    const now = start + offset;
    if (lastSyncedAt && now < syncDueAt(lastSyncedAt, intervalMinutes, options).getTime()) continue;
    synced.push(offset);
    lastSyncedAt = new Date(now + SYNC_DURATION);
  }
  return synced;
}

const every = (periodMs, count) => Array.from({ length: count }, (_, i) => i * periodMs);

test("the built-in scheduler waits for the full interval", () => {
  const last = new Date(start);
  assert.equal(syncDueAt(last, 60).getTime(), start + HOUR);
  assert.equal(syncDueAt(last, 60, { cron: false }).getTime(), start + HOUR);
});

test("a cron call may arrive up to 10% of the interval early", () => {
  const last = new Date(start);
  assert.equal(syncDueAt(last, 60, { cron: true }).getTime(), start + 54 * MINUTE);
  assert.equal(syncDueAt(last, 1440, { cron: true }).getTime(), start + 21.6 * HOUR);
});

test("an hourly cron with an hourly setting syncs on every call", () => {
  const calls = every(HOUR, 24);
  // The strict check skipped every other call, since each one came a few
  // seconds short of an hour after the previous sync finished.
  assert.equal(replay(calls, 60).length, 12);
  assert.equal(replay(calls, 60, { cron: true }).length, 24);
});

test("a daily cron that fires anywhere in its hour still syncs every day", () => {
  // Vercel Hobby: scheduled for 08:00, fired at a different minute each day.
  const minutes = [59, 2, 40, 0, 31, 58, 1];
  const calls = minutes.map((m, day) => day * 24 * HOUR + 8 * HOUR + m * MINUTE);
  assert.equal(replay(calls, 1440, { cron: true }).length, minutes.length);
});

test("a cron finer than the setting still waits for the matching call", () => {
  // Hourly calls with a six-hour setting sync every sixth call.
  assert.deepEqual(replay(every(HOUR, 13), 360, { cron: true }), [0, 6 * HOUR, 12 * HOUR]);
  // Half-hourly calls with an hourly setting sync every other call.
  assert.equal(replay(every(30 * MINUTE, 8), 60, { cron: true }).length, 4);
});
