import assert from "node:assert/strict";
import test from "node:test";
import {
  getTimeRange,
  isValidTimeZone,
  parseDateOnlyInTimeZone,
  toUnix,
} from "../lib/time-range.ts";

const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;

/** What a wall clock in `timeZone` shows at `date`, to the millisecond. */
function wallClock(date, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  const { year, month, day, hour, minute, second, fractionalSecond } = parts;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${fractionalSecond}`;
}

test("a custom range runs from the first to the last millisecond of its days", () => {
  assert.deepEqual(getTimeRange({ from: "2026-10-01", to: "2026-10-07" }, "Asia/Taipei"), {
    since: new Date("2026-09-30T16:00:00.000Z"),
    until: new Date("2026-10-07T15:59:59.999Z"),
  });
  assert.deepEqual(getTimeRange({ from: "2026-10-01", to: "2026-10-01" }, "UTC"), {
    since: new Date("2026-10-01T00:00:00.000Z"),
    until: new Date("2026-10-01T23:59:59.999Z"),
  });
});

test("day boundaries hold on the days clocks change", () => {
  const changes = [
    ["America/Los_Angeles", "2026-03-08", 23],
    ["America/Los_Angeles", "2026-11-01", 25],
    ["Europe/London", "2026-03-29", 23],
    ["Europe/London", "2026-10-25", 25],
    ["Pacific/Auckland", "2026-04-05", 25],
    ["Pacific/Auckland", "2026-09-27", 23],
  ];
  for (const [timeZone, day, hours] of changes) {
    const since = parseDateOnlyInTimeZone(day, timeZone, false);
    const until = parseDateOnlyInTimeZone(day, timeZone, true);
    assert.equal(wallClock(since, timeZone), `${day}T00:00:00.000`, `${timeZone} ${day}`);
    assert.equal(wallClock(until, timeZone), `${day}T23:59:59.999`, `${timeZone} ${day}`);
    assert.equal(until.getTime() + 1 - since.getTime(), hours * HOUR, `${timeZone} ${day}`);
  }
});

test("a day whose midnight is skipped starts when the clock resumes", () => {
  // Santiago and Havana spring forward from 00:00 straight to 01:00; the start
  // used to resolve to 23:00 the evening before.
  for (const [timeZone, day] of [
    ["America/Santiago", "2026-09-06"],
    ["America/Havana", "2026-03-08"],
  ]) {
    const since = parseDateOnlyInTimeZone(day, timeZone, false);
    assert.equal(wallClock(since, timeZone), `${day}T01:00:00.000`, timeZone);
    assert.notEqual(wallClock(new Date(since.getTime() - 1), timeZone).slice(0, 10), day);
  }
});

test("a day whose last hour repeats ends after the second pass", () => {
  // Santiago falls back from 24:00 to 23:00 on 4 April, so 23:00–23:59 happens
  // twice. Ending on the first pass dropped the repeated hour from both 4 and
  // 5 April.
  const until = parseDateOnlyInTimeZone("2026-04-04", "America/Santiago", true);
  const nextSince = parseDateOnlyInTimeZone("2026-04-05", "America/Santiago", false);
  assert.equal(until.toISOString(), "2026-04-05T03:59:59.999Z");
  assert.equal(nextSince.getTime(), until.getTime() + 1);
});

test("adjacent days never overlap or leave a gap", () => {
  for (const timeZone of ["America/Santiago", "America/Havana", "Europe/London"]) {
    for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2027, 0, 1); t += DAY) {
      const day = new Date(t).toISOString().slice(0, 10);
      const next = new Date(t + DAY).toISOString().slice(0, 10);
      const until = parseDateOnlyInTimeZone(day, timeZone, true);
      const nextSince = parseDateOnlyInTimeZone(next, timeZone, false);
      assert.equal(nextSince.getTime() - until.getTime(), 1, `${timeZone} ${day}`);
    }
  }
});

test("a custom range falls back to a preset when a date can't be read", () => {
  const { since, until } = getTimeRange({ from: "not a date", to: "2026-10-07", range: "7" });
  assert.ok(Math.abs(until.getTime() - since.getTime() - 7 * DAY) < 1000);
  // A range needs both ends; one alone is ignored.
  const open = getTimeRange({ from: "2026-10-01", range: "30" });
  assert.ok(Math.abs(open.until.getTime() - open.since.getTime() - 30 * DAY) < 1000);
});

test("preset ranges count back from now, defaulting to 90 days", () => {
  const span = (range) => {
    const { since, until } = getTimeRange(range);
    return Math.round((until.getTime() - since.getTime()) / DAY);
  };
  assert.equal(span("7"), 7);
  assert.equal(span("365"), 365);
  assert.equal(span(undefined), 90);
  assert.equal(span("14"), 90);
  // An inherited property name is not a preset.
  assert.equal(span("toString"), 90);
  assert.deepEqual(getTimeRange("all").since, new Date("2020-01-01"));
});

test("an unknown time zone falls back to the default one", () => {
  const params = { from: "2026-10-01", to: "2026-10-07" };
  assert.equal(isValidTimeZone("Asia/Taipei"), true);
  assert.equal(isValidTimeZone("Mars/Olympus_Mons"), false);
  assert.deepEqual(getTimeRange(params, "Mars/Olympus_Mons"), getTimeRange(params));
});

test("unix timestamps are whole seconds", () => {
  assert.equal(toUnix(new Date("2026-10-06T00:00:00.999Z")), 1_791_244_800);
});
