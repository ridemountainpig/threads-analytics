import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import test, { beforeEach } from "node:test";
import { resetDb, rowsOf } from "./support/fake-db.mjs";
import { createThreadsApi, serverError } from "./support/fake-threads-api.mjs";

// Next's server sets this global up before loading any route; its request
// stores are built on it.
globalThis.AsyncLocalStorage = AsyncLocalStorage;
delete process.env.NEXT_PUBLIC_RUNTIME_TARGET;
const { workAsyncStorage } =
  await import("next/dist/server/app-render/work-async-storage.external.js");
const { GET, POST } = await import("../app/api/cron/sync/route.ts");
const { encryptToken } = await import("../lib/crypto.ts");

const DAY = 24 * 60 * 60_000;
const SECRET = "cron-secret-5f2a";

let api;

beforeEach((t) => {
  resetDb();
  process.env.CRON_SECRET = SECRET;
  process.env.TOKEN_ENCRYPTION_KEY = "test-encryption-key";
  api = createThreadsApi();
  t.mock.method(globalThis, "fetch", api.fetch);
  t.mock.method(console, "warn", () => {});
});

const setInterval = (value) => rowsOf("appSettings").push({ key: "syncInterval", value });

/** A connected account that has never synced, so any enabled run syncs it. */
function account() {
  rowsOf("threadsAccount").push({
    id: "1789",
    username: "someone",
    accessToken: encryptToken("THAAG-current"),
    expiresAt: new Date(Date.now() + 50 * DAY),
    tokenRefreshedAt: new Date(Date.now() - DAY),
    tokenCheckedAt: new Date(Date.now() - DAY),
    isActive: true,
    createdAt: new Date(),
  });
}

function call(headers = {}, { method = GET, query = "" } = {}) {
  return method(new Request(`http://localhost/api/cron/sync${query}`, { headers }));
}

/** Runs a call the way Next does, with a store that collects revalidated paths. */
async function callInRoute(headers) {
  const store = { route: "/api/cron/sync", page: "/api/cron/sync/route", incrementalCache: {} };
  const response = await workAsyncStorage.run(store, () => call(headers));
  return { response, revalidated: (store.pendingRevalidatedTags ?? []).map((t) => t.tag) };
}

test("with no CRON_SECRET configured, every call is refused", async () => {
  delete process.env.CRON_SECRET;
  setInterval("60");
  account();
  for (const headers of [
    {},
    { authorization: "Bearer " },
    { authorization: "Bearer undefined" },
    { "x-cron-secret": "" },
  ]) {
    const response = await call(headers);
    assert.equal(response.status, 401, JSON.stringify(headers));
  }
  assert.equal(api.requests.length, 0);
});

test("a secret that is wrong, cut short, extended or in another scheme is refused", async () => {
  setInterval("60");
  account();
  for (const headers of [
    { authorization: "Bearer wrong" },
    { authorization: `Bearer ${SECRET.slice(0, -1)}` },
    { authorization: `Bearer ${SECRET}0` },
    { authorization: `Bearer ${SECRET.toUpperCase()}` },
    { authorization: `Bearer  ${SECRET}` },
    { authorization: `Basic ${SECRET}` },
    { "x-cron-secret": SECRET.slice(1) },
  ]) {
    const response = await call(headers);
    assert.equal(response.status, 401, JSON.stringify(headers));
    assert.deepEqual(await response.json(), { error: "Unauthorized" });
  }
  assert.equal(api.requests.length, 0);
});

test("the secret is accepted as a bearer token or in x-cron-secret, on GET and POST", async () => {
  setInterval("0");
  for (const method of [GET, POST]) {
    for (const headers of [{ authorization: `Bearer ${SECRET}` }, { "x-cron-secret": SECRET }]) {
      const response = await call(headers, { method });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { status: "disabled", interval: "0" });
    }
  }
});

test("force=true or force=1 runs even with automatic sync off", async () => {
  setInterval("0");
  const headers = { authorization: `Bearer ${SECRET}` };
  for (const query of ["?force=true", "?force=1"]) {
    const response = await call(headers, { query });
    assert.deepEqual(await response.json(), { status: "no_accounts" }, query);
  }
  const response = await call(headers, { query: "?force=yes" });
  assert.equal((await response.json()).status, "disabled");
});

test("a run with a failed account answers 500", async () => {
  setInterval("60");
  account();
  api.failures.set("threads", serverError());
  const response = await call({ "x-cron-secret": SECRET });
  assert.equal(response.status, 500);
  const body = await response.json();
  assert.equal(body.status, "failed");
  assert.equal(body.accounts[0].status, "failed");
});

test("a run that synced refreshes the dashboard, and one with nothing due doesn't", async () => {
  setInterval("60");
  account();
  const synced = await callInRoute({ "x-cron-secret": SECRET });
  assert.equal(synced.response.status, 200);
  assert.equal((await synced.response.json()).status, "synced");
  assert.deepEqual(synced.revalidated, ["_N_T_/dashboard"]);

  const idle = await callInRoute({ "x-cron-secret": SECRET });
  assert.equal((await idle.response.json()).status, "not_due");
  assert.deepEqual(idle.revalidated, []);
});
