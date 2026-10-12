import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { resetDb, rowsOf } from "./support/fake-db.mjs";
import { holdSyncLock } from "./support/fake-sync-lock.mjs";
import { createThreadsApi } from "./support/fake-threads-api.mjs";

delete process.env.NEXT_PUBLIC_RUNTIME_TARGET;
const { runScheduledSync } = await import("../lib/sync-scheduler.ts");
const { encryptToken } = await import("../lib/crypto.ts");

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

let api;

beforeEach((t) => {
  resetDb();
  process.env.TOKEN_ENCRYPTION_KEY = "test-encryption-key";
  api = createThreadsApi();
  t.mock.method(globalThis, "fetch", api.fetch);
  t.mock.method(console, "warn", () => {});
});

const ago = (ms) => new Date(Date.now() - ms);
const setInterval = (value) => rowsOf("appSettings").push({ key: "syncInterval", value });

/** A connected account, last synced `lastSyncedAgo` ago (never, if omitted). */
function account({ id = "1789", username = "someone", lastSyncedAgo, ...fields } = {}) {
  rowsOf("threadsAccount").push({
    id,
    username,
    accessToken: encryptToken(`THAAG-${id}`),
    expiresAt: new Date(Date.now() + 50 * DAY),
    tokenRefreshedAt: ago(DAY),
    tokenCheckedAt: ago(DAY),
    isActive: true,
    createdAt: ago(DAY),
    ...fields,
  });
  if (lastSyncedAgo !== undefined) {
    rowsOf("syncState").push({ accountId: id, lastSyncedAt: ago(lastSyncedAgo) });
  }
}

const tokensUsed = () =>
  new Set(api.requests.map((request) => request.url.searchParams.get("access_token")));

test("automatic sync stays off until a whole number of minutes is set", async () => {
  account();
  assert.deepEqual(await runScheduledSync(), { status: "disabled", interval: "0" });
  for (const interval of ["0", "-60", "1.5", "60m", ""]) {
    resetDb();
    account();
    setInterval(interval);
    assert.deepEqual(await runScheduledSync(), { status: "disabled", interval }, interval);
  }
  assert.equal(api.requests.length, 0);
});

test("force syncs even with automatic sync off", async () => {
  account();
  const result = await runScheduledSync({ force: true });
  assert.equal(result.status, "synced");
  assert.equal(result.accounts[0].status, "synced");
});

test("with no account connected there is nothing to sync", async () => {
  setInterval("60");
  assert.deepEqual(await runScheduledSync(), { status: "no_accounts" });
});

test("an account comes due once its interval has passed since the last sync", async () => {
  setInterval("60");
  account({ lastSyncedAgo: 59 * MINUTE });
  const early = await runScheduledSync();
  assert.equal(early.status, "not_due");
  const [{ lastSyncedAt, nextSyncAt }] = early.accounts;
  assert.equal(Date.parse(nextSyncAt) - Date.parse(lastSyncedAt), 60 * MINUTE);
  assert.equal(api.requests.length, 0);

  rowsOf("syncState")[0].lastSyncedAt = ago(61 * MINUTE);
  const due = await runScheduledSync();
  assert.equal(due.status, "synced");
  assert.ok(rowsOf("syncState")[0].lastSyncedAt > ago(MINUTE));
});

test("a cron call may arrive a tenth of the interval early; the built-in poll may not", async () => {
  setInterval("60");
  account({ lastSyncedAgo: 55 * MINUTE });
  assert.equal((await runScheduledSync()).status, "not_due");
  assert.equal((await runScheduledSync({ cron: true })).status, "synced");
});

test("an account whose token has expired is reported without calling Threads", async () => {
  setInterval("60");
  account({ username: "expired", expiresAt: ago(MINUTE) });
  const result = await runScheduledSync({ force: true });
  assert.deepEqual(result.accounts, [{ username: "expired", status: "token_expired" }]);
  assert.equal(result.status, "token_expired");
  assert.equal(api.requests.length, 0);
});

test("every connected account is synced, the active one first", async () => {
  setInterval("60");
  api.posts = [];
  account({ id: "1", username: "older", isActive: false, createdAt: ago(2 * DAY) });
  account({ id: "2", username: "active", createdAt: ago(DAY) });
  account({ id: "3", username: "newer", isActive: false, createdAt: ago(MINUTE) });
  const result = await runScheduledSync();
  assert.deepEqual(
    result.accounts.map(({ username, status }) => [username, status]),
    [
      ["active", "synced"],
      ["older", "synced"],
      ["newer", "synced"],
    ],
  );
  assert.deepEqual(tokensUsed(), new Set(["THAAG-1", "THAAG-2", "THAAG-3"]));
});

test("the run reports its most urgent account: failed, then synced, expired, not due", async () => {
  const kinds = {
    failed: { accessToken: "not-an-encrypted-token" },
    synced: {},
    expired: { expiresAt: ago(MINUTE) },
    idle: { lastSyncedAgo: MINUTE },
  };
  const statusOf = async (...names) => {
    resetDb();
    setInterval("60");
    names.forEach((name, i) => account({ id: String(i + 1), username: name, ...kinds[name] }));
    return (await runScheduledSync()).status;
  };
  assert.equal(await statusOf("idle", "expired", "synced", "failed"), "failed");
  assert.equal(await statusOf("idle", "expired", "synced"), "synced");
  assert.equal(await statusOf("idle", "expired"), "token_expired");
  assert.equal(await statusOf("idle"), "not_due");
});

test("a failed account keeps its error and doesn't stop the others", async () => {
  setInterval("60");
  account({ id: "1", username: "broken", accessToken: "not-an-encrypted-token" });
  account({ id: "2", username: "fine", isActive: false });
  const result = await runScheduledSync();
  assert.equal(result.accounts[0].username, "broken");
  assert.equal(result.accounts[0].status, "failed");
  assert.match(result.accounts[0].error, /credentials are unavailable/);
  assert.equal(result.accounts[1].status, "synced");
});

test("a run already going in this process is not started again", async () => {
  setInterval("60");
  account();
  const first = runScheduledSync();
  assert.deepEqual(await runScheduledSync(), { status: "in_progress" });
  assert.equal((await first).status, "synced");
  assert.equal((await runScheduledSync({ force: true })).status, "synced");
});

test("a run another process holds the lock for is left to it", async () => {
  setInterval("60");
  account();
  const release = holdSyncLock();
  assert.deepEqual(await runScheduledSync(), { status: "locked" });
  assert.equal(api.requests.length, 0);
  release();
  assert.equal((await runScheduledSync()).status, "synced");
});
