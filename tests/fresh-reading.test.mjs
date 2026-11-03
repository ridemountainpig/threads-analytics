import assert from "node:assert/strict";
import test from "node:test";

const { isFreshReading } = await import("../lib/fresh-reading.ts");

const now = Date.parse("2026-11-03T13:00:00+08:00");
const ttl = 5 * 60 * 1000;
const readAt = (iso, value = 1815) => ({ value, fetchedAt: Date.parse(`${iso}+08:00`) });

test("a cached reading counts only while it is within its TTL", () => {
  assert.equal(isFreshReading(readAt("2026-11-03T12:58:00"), now, ttl), true);
  // Read alongside the request, a moment after `now` was taken.
  assert.equal(isFreshReading(readAt("2026-11-03T13:00:01"), now, ttl), true);
  // An entry served long past its TTL, e.g. from two days ago.
  assert.equal(isFreshReading(readAt("2026-11-01T09:00:00"), now, ttl), false);
});

test("a cached reading from before `notBefore` is stale even within its TTL", () => {
  const midnight = Date.parse("2026-11-03T00:00:00+08:00");
  const justAfter = midnight + 2 * 60 * 1000;
  assert.equal(isFreshReading(readAt("2026-11-02T23:59:00"), justAfter, ttl, midnight), false);
  assert.equal(isFreshReading(readAt("2026-11-03T00:01:00"), justAfter, ttl, midnight), true);
});

test("entries without a fetch time count as stale", () => {
  assert.equal(isFreshReading(null, now, ttl), false);
  assert.equal(isFreshReading(1815, now, ttl), false);
  // Cached by an earlier version: a bare value, or a count without `value`.
  assert.equal(isFreshReading({ replies: [] }, now, ttl), false);
  assert.equal(isFreshReading({ count: 1815, fetchedAt: now }, now, ttl), false);
  // A legitimately null value is still a reading.
  assert.equal(isFreshReading({ value: null, fetchedAt: now }, now, ttl), true);
});
