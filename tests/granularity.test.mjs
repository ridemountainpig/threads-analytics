import assert from "node:assert/strict";
import test from "node:test";
import { toDateKey } from "../lib/granularity.ts";

test("toDateKey returns the YYYY-MM-DD day in the given time zone", () => {
  const instant = new Date("2026-03-01T17:30:00Z");
  assert.equal(toDateKey(instant, "UTC"), "2026-03-01");
  assert.equal(toDateKey(instant, "Asia/Taipei"), "2026-03-02");
  assert.equal(toDateKey(instant, "America/Los_Angeles"), "2026-03-01");
});

test("toDateKey zero-pads month and day", () => {
  assert.equal(toDateKey(new Date("2026-01-05T00:00:00Z"), "UTC"), "2026-01-05");
});
