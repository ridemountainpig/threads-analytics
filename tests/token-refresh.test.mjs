import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { resetDb, rowsOf } from "./support/fake-db.mjs";
import { createThreadsApi, expiredToken, serverError } from "./support/fake-threads-api.mjs";
import { decryptToken, encryptToken } from "../lib/crypto.ts";
import { TokenExpiredError } from "../lib/threads-api.ts";
import { ensureFreshToken } from "../lib/token-refresh.ts";

const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;
const CURRENT = "THAAG-current";

let api;

beforeEach((t) => {
  resetDb();
  process.env.TOKEN_ENCRYPTION_KEY = "test-encryption-key";
  api = createThreadsApi();
  t.mock.method(globalThis, "fetch", api.fetch);
  t.mock.method(console, "warn", () => {});
});

/** Stores an account and returns it as a sync would read it. */
function account(fields = {}) {
  const row = {
    id: "1789",
    username: "someone",
    accessToken: encryptToken(CURRENT),
    expiresAt: new Date(Date.now() + 50 * DAY),
    tokenRefreshedAt: new Date(Date.now() - DAY),
    tokenCheckedAt: new Date(Date.now() - DAY),
    ...fields,
  };
  rowsOf("threadsAccount").push(row);
  return { ...row };
}

const stored = () => rowsOf("threadsAccount")[0];
const near = (date, expected, message) =>
  assert.ok(Math.abs(date.getTime() - expected) < 5000, message);

test("a pasted token that was never renewed is renewed on its first sync", async () => {
  const token = await ensureFreshToken(
    account({ tokenRefreshedAt: null, tokenCheckedAt: null }),
    CURRENT,
  );
  assert.equal(token, "THAAG-renewed");
  const [request] = api.calls("refresh");
  assert.equal(request.url.searchParams.get("grant_type"), "th_refresh_token");
  assert.equal(request.url.searchParams.get("access_token"), CURRENT);

  // The new token is stored encrypted, with the expiry the API reported.
  assert.equal(decryptToken(stored().accessToken), "THAAG-renewed");
  near(stored().expiresAt, Date.now() + 60 * DAY, "expiresAt");
  near(stored().tokenRefreshedAt, Date.now(), "tokenRefreshedAt");
  near(stored().tokenCheckedAt, Date.now(), "tokenCheckedAt");
});

test("attempts for a token never renewed are spaced six hours apart", async () => {
  const recent = account({ tokenRefreshedAt: null, tokenCheckedAt: new Date(Date.now() - HOUR) });
  assert.equal(await ensureFreshToken(recent, CURRENT), CURRENT);
  assert.equal(api.calls("refresh").length, 0);

  const due = { ...recent, tokenCheckedAt: new Date(Date.now() - 7 * HOUR) };
  assert.equal(await ensureFreshToken(due, CURRENT), "THAAG-renewed");
});

test("a renewed token is left alone until fewer than 30 days remain", async () => {
  const fresh = account({ expiresAt: new Date(Date.now() + 31 * DAY) });
  assert.equal(await ensureFreshToken(fresh, CURRENT), CURRENT);
  assert.equal(api.calls("refresh").length, 0);

  const ageing = { ...fresh, expiresAt: new Date(Date.now() + 29 * DAY) };
  assert.equal(await ensureFreshToken(ageing, CURRENT), "THAAG-renewed");
});

test("a failed renewal keeps the current token and records the attempt", async () => {
  // Threads refuses to renew a token younger than a day, for one.
  api.failures.set("refresh", serverError());
  const before = account({ expiresAt: new Date(Date.now() + 10 * DAY) });
  assert.equal(await ensureFreshToken(before, CURRENT), CURRENT);
  assert.equal(decryptToken(stored().accessToken), CURRENT);
  assert.deepEqual(stored().expiresAt, before.expiresAt);
  assert.deepEqual(stored().tokenRefreshedAt, before.tokenRefreshedAt);
  near(stored().tokenCheckedAt, Date.now(), "tokenCheckedAt");
});

test("a renewal answer without a token and expiry is a failure, not a new token", async () => {
  for (const answer of [{ access_token: "THAAG-renewed" }, { expires_in: 100 }, "not json"]) {
    resetDb();
    api.failures.set("refresh", { status: 200, body: answer });
    const before = account({ expiresAt: new Date(Date.now() + 10 * DAY) });
    assert.equal(await ensureFreshToken(before, CURRENT), CURRENT, JSON.stringify(answer));
    assert.deepEqual(stored().expiresAt, before.expiresAt);
  }
});

test("a revoked token propagates, so the account shows as disconnected", async () => {
  api.failures.set("refresh", expiredToken());
  const before = account({ tokenRefreshedAt: null, tokenCheckedAt: null });
  await assert.rejects(ensureFreshToken(before, CURRENT), TokenExpiredError);
  near(stored().tokenCheckedAt, Date.now(), "tokenCheckedAt");
});

test("failing to record an attempt doesn't hide the token from the sync", async () => {
  api.failures.set("refresh", serverError());
  // No stored row, so recording tokenCheckedAt fails too.
  const orphan = {
    id: "gone",
    expiresAt: new Date(Date.now() + DAY),
    tokenRefreshedAt: new Date(),
    tokenCheckedAt: null,
  };
  assert.equal(await ensureFreshToken(orphan, CURRENT), CURRENT);
});
