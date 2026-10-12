import assert from "node:assert/strict";
import test from "node:test";
import { createIpRateLimiter, getClientIp } from "../lib/login-rate-limit.ts";

// Mirrors MAX_TRACKED_IPS in lib/login-rate-limit.ts.
const MAX_TRACKED_IPS = 500;

const attempts = (limiter, ip, count) => Array.from({ length: count }, () => limiter.consume(ip));

test("an IP gets its budget per window, and then waits for the window to end", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: 0 });
  const limiter = createIpRateLimiter(3, 1000);
  assert.deepEqual(attempts(limiter, "203.0.113.9", 4), [true, true, true, false]);
  // Each IP has a budget of its own.
  assert.equal(limiter.consume("198.51.100.7"), true);

  // Blocked attempts don't push the window back, and it ends after, not at, resetAt.
  t.mock.timers.tick(1000);
  assert.equal(limiter.consume("203.0.113.9"), false);
  t.mock.timers.tick(1);
  assert.deepEqual(attempts(limiter, "203.0.113.9", 4), [true, true, true, false]);
});

test("a successful login clears the IP's attempts", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: 0 });
  const limiter = createIpRateLimiter(2, 1000);
  attempts(limiter, "203.0.113.9", 2);
  assert.equal(limiter.consume("203.0.113.9"), false);
  limiter.clear("203.0.113.9");
  assert.equal(limiter.consume("203.0.113.9"), true);
});

test("a full table drops expired windows before live ones", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: 0 });
  const limiter = createIpRateLimiter(1, 1000);
  limiter.consume("victim");
  for (let i = 0; i < 10; i++) limiter.consume(`early-${i}`);

  // The victim starts a new window but keeps its place as the oldest entry,
  // while the early windows behind it have ended.
  t.mock.timers.tick(1100);
  assert.deepEqual(attempts(limiter, "victim", 2), [true, false]);
  for (let i = 0; i < MAX_TRACKED_IPS - 11; i++) limiter.consume(`late-${i}`);

  // Pruning the ended windows makes room, so the oldest live one is kept.
  limiter.consume("newcomer");
  assert.equal(limiter.consume("victim"), false);
});

test("a flood of distinct IPs evicts the oldest window instead of growing the table", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: 0 });
  const limiter = createIpRateLimiter(1, 1000);
  for (let i = 0; i < MAX_TRACKED_IPS; i++) limiter.consume(`ip-${i}`);
  limiter.consume("one-too-many");
  // Every newer IP is still limited...
  assert.equal(limiter.consume("ip-1"), false);
  assert.equal(limiter.consume(`ip-${MAX_TRACKED_IPS - 1}`), false);
  assert.equal(limiter.consume("one-too-many"), false);
  // ...and only the oldest made way, which is what keeps the table bounded.
  assert.equal(limiter.consume("ip-0"), true);
});

test("the client IP is the entry our proxy appended, not one the client sent", () => {
  const ip = (headers) => getClientIp(new Headers(headers));
  // A client can send any X-Forwarded-For; the proxy appends the real address.
  assert.equal(ip({ "x-forwarded-for": "1.1.1.1, 198.51.100.7" }), "198.51.100.7");
  assert.equal(ip({ "x-forwarded-for": " 198.51.100.7 , " }), "198.51.100.7");
  assert.equal(ip({ "x-forwarded-for": ", ,", "x-real-ip": " 203.0.113.9 " }), "203.0.113.9");
  assert.equal(ip({ "x-real-ip": "203.0.113.9" }), "203.0.113.9");
  assert.equal(ip({}), "unknown");
});
