import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { resetDb, rowsOf } from "./support/fake-db.mjs";
import {
  createThreadsApi,
  expiredToken,
  missingReplyPermission,
  serverError,
} from "./support/fake-threads-api.mjs";

// Follower snapshots are dated in DEFAULT_TZ, read from the environment when
// lib/analytics.ts is first imported.
delete process.env.NEXT_PUBLIC_RUNTIME_TARGET;
process.env.NEXT_PUBLIC_ANALYTICS_TIME_ZONE = "Asia/Taipei";
const { syncAccount, syncAccounts } = await import("../lib/sync-service.ts");
const { encryptToken } = await import("../lib/crypto.ts");
const { DEFAULT_TZ, getDateString } = await import("../lib/analytics.ts");

const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;
const ACCOUNT_ID = "1789";
const TOKEN = "THAAG-current";
const BREAKDOWNS = ["country", "city", "age", "gender"];

let api;

beforeEach((t) => {
  resetDb();
  process.env.TOKEN_ENCRYPTION_KEY = "test-encryption-key";
  api = createThreadsApi();
  t.mock.method(globalThis, "fetch", api.fetch);
  t.mock.method(console, "warn", () => {});
});

const ago = (ms) => new Date(Date.now() - ms);
const today = () => new Date(`${getDateString(new Date(), DEFAULT_TZ)}T00:00:00.000Z`);
const metrics = (views) => ({
  views,
  likes: views / 10,
  replies: 1,
  reposts: 0,
  quotes: 0,
  shares: 2,
});
const zero = { views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0, shares: 0 };

/** A connected account whose token needs no renewal, as a sync reads it. */
function account(fields = {}) {
  const row = {
    id: ACCOUNT_ID,
    username: "someone",
    accessToken: encryptToken(TOKEN),
    expiresAt: new Date(Date.now() + 50 * DAY),
    tokenRefreshedAt: ago(DAY),
    tokenCheckedAt: ago(DAY),
    ...fields,
  };
  rowsOf("threadsAccount").push(row);
  return { ...row };
}

/** A post as /threads lists it, published `ageMs` ago. */
const listed = (id, ageMs, mediaType = "TEXT_POST") => ({
  id,
  text: `post ${id}`,
  timestamp: ago(ageMs).toISOString(),
  media_type: mediaType,
  permalink: `https://www.threads.com/@someone/post/${id}`,
});

/** A post already stored by an earlier sync. */
const stored = (id, ageMs, values) => ({
  id,
  accountId: ACCOUNT_ID,
  text: `post ${id}`,
  timestamp: ago(ageMs),
  mediaType: "TEXT_POST",
  permalink: `https://www.threads.com/@someone/post/${id}`,
  syncedAt: ago(HOUR),
  ...values,
});

/** One of the author's replies as /replies lists it. */
const reply = (id, ageMs, rootId, repliedToId) => ({
  id,
  text: `reply ${id}`,
  timestamp: ago(ageMs).toISOString(),
  media_type: "TEXT_POST",
  permalink: "",
  root_post: { id: rootId },
  replied_to: { id: repliedToId },
});

const post = (id) => rowsOf("post").find((row) => row.id === id);
const insightCalls = () => api.requests.filter((r) => r.key.startsWith("insights:"));
const demographicCalls = () =>
  api.requests.filter((r) => r.key.startsWith("follower_demographics:"));

test("a first sync stores every post, its thread parts and today's followers", async () => {
  api = createThreadsApi({ pageSize: 1 });
  globalThis.fetch.mock.mockImplementation(api.fetch);
  api.posts = [listed("p1", HOUR), listed("p2", 2 * DAY), listed("r1", HOUR, "REPOST_FACADE")];
  api.insights.set("p1", metrics(100)).set("p2", metrics(300)).set("p1-2", metrics(40));
  api.replies = [
    reply("p1-2", HOUR - 60_000, "p1", "p1"),
    reply("answer", 30 * 60_000, "p1", "a-commenters-reply"),
    reply("elsewhere", 10 * 60_000, "someone-elses-post", "someone-elses-post"),
  ];

  const result = await syncAccount(account());
  assert.deepEqual(result, { postsCount: 2, threadRepliesCount: 1 });

  // Paged through all three, leaving out the repost.
  assert.equal(api.calls("threads").length, 3);
  assert.deepEqual(
    rowsOf("post").map((row) => [row.id, row.views]),
    [
      ["p1", 100],
      ["p2", 300],
    ],
  );
  const [part] = rowsOf("threadReply");
  assert.deepEqual([part.id, part.rootPostId, part.position, part.views], ["p1-2", "p1", 2, 40]);

  const [state] = rowsOf("syncState");
  assert.ok(state.lastSyncedAt instanceof Date);
  assert.ok(state.repliesSyncedAt instanceof Date);

  const [snapshot] = rowsOf("followerSnapshot");
  assert.deepEqual(snapshot.date, today());
  assert.equal(snapshot.followersCount, 1000);
  assert.deepEqual(snapshot.demographics.country, {
    total: 700,
    entries: [{ key: "TW", value: 700 }],
  });

  // Both posts are young enough to have their growth recorded.
  assert.deepEqual(
    rowsOf("postMetricSnapshot").map((row) => [row.postId, row.views]),
    [
      ["p1", 100],
      ["p2", 300],
    ],
  );
});

test("insights are re-read on the post's spacing, and one stuck at zero once a day", async () => {
  rowsOf("post").push(
    stored("due", 3 * DAY, { ...metrics(10), syncedAt: ago(7 * HOUR) }),
    stored("just-read", 3 * DAY, metrics(10)),
    stored("settled", 40 * DAY, { ...metrics(50), syncedAt: ago(2 * DAY) }),
    stored("stuck-at-zero", 40 * DAY, { ...zero, syncedAt: ago(2 * DAY) }),
    stored("retried-today", 40 * DAY, zero),
  );
  api.posts = [
    listed("due", 3 * DAY),
    listed("just-read", 3 * DAY),
    listed("settled", 40 * DAY),
    listed("stuck-at-zero", 40 * DAY),
    listed("retried-today", 40 * DAY),
  ];
  api.insights.set("due", metrics(20)).set("stuck-at-zero", metrics(80));

  assert.equal((await syncAccount(account())).postsCount, 5);
  assert.deepEqual(
    insightCalls().map((r) => r.key),
    ["insights:due", "insights:stuck-at-zero"],
  );
  assert.equal(post("due").views, 20);
  assert.equal(post("settled").views, 50);
  assert.equal(post("stuck-at-zero").views, 80);
});

test("a failed insights fetch keeps the post's numbers and is counted", async () => {
  rowsOf("post").push(stored("p1", HOUR, metrics(100)));
  api.posts = [listed("p1", HOUR), listed("p2", HOUR)];
  api.failures.set("insights:p1", serverError());
  api.insights.set("p2", metrics(10));

  assert.deepEqual(await syncAccount(account()), {
    postsCount: 2,
    insightsFailed: 1,
    threadRepliesCount: 0,
  });
  assert.equal(post("p1").views, 100);
  // A reading that failed leaves a gap instead of repeating the old numbers.
  assert.deepEqual(
    rowsOf("postMetricSnapshot").map((row) => row.postId),
    ["p2"],
  );

  // The read is still due, so the next sync tries again.
  api.failures.clear();
  api.insights.set("p1", metrics(120));
  await syncAccount(account());
  assert.equal(post("p1").views, 120);
});

test("a post whose first read failed is retried on the next sync, however old", async () => {
  api.posts = [listed("old", 40 * DAY)];
  api.failures.set("insights:old", serverError());
  assert.equal((await syncAccount(account())).insightsFailed, 1);
  assert.equal(post("old").views, 0);

  api.failures.clear();
  api.insights.set("old", metrics(80));
  await syncAccount(account());
  assert.equal(post("old").views, 80);
});

test("an edited post is rewritten without waiting for its next reading", async () => {
  const readAt = ago(HOUR);
  rowsOf("post").push(stored("p1", 3 * DAY, { ...metrics(100), syncedAt: readAt }));
  api.posts = [{ ...listed("p1", 3 * DAY), text: "post p1, edited" }];

  await syncAccount(account());
  assert.equal(insightCalls().length, 0);
  assert.equal(post("p1").text, "post p1, edited");
  assert.equal(post("p1").views, 100);
  assert.deepEqual(post("p1").syncedAt, readAt);
});

test("later syncs list back to the snapshot window, or a day before a longer gap", async () => {
  api = createThreadsApi({ pageSize: 1 });
  globalThis.fetch.mock.mockImplementation(api.fetch);
  api.posts = [HOUR, 10 * DAY, 31 * DAY, 40 * DAY, 50 * DAY, 60 * DAY].map((ageMs, i) =>
    listed(`p${i}`, ageMs),
  );
  const listings = () => api.calls("threads").length;

  await syncAccount(account());
  assert.equal(listings(), 6);

  // Stops at the first page past 30 days, picking up the new post on the way.
  api.posts.unshift(listed("new", 10 * 60_000));
  await syncAccount(account());
  assert.equal(listings(), 6 + 4);
  assert.ok(post("new"));

  rowsOf("syncState")[0].lastSyncedAt = ago(45 * DAY);
  await syncAccount(account());
  assert.equal(listings(), 6 + 4 + 6);
  assert.equal(rowsOf("post").length, 7);
});

test("a post at zero past the listed range is read by id, a deleted one is not", async () => {
  api = createThreadsApi({ pageSize: 1 });
  globalThis.fetch.mock.mockImplementation(api.fetch);
  rowsOf("syncState").push({
    accountId: ACCOUNT_ID,
    lastSyncedAt: ago(HOUR),
    repliesSyncedAt: ago(HOUR),
  });
  rowsOf("post").push(
    stored("deleted", 5 * DAY, { ...zero, syncedAt: ago(2 * DAY) }),
    stored("month-old", 31 * DAY, metrics(10)),
    stored("old-at-zero", 60 * DAY, { ...zero, syncedAt: ago(2 * DAY) }),
  );
  api.posts = [listed("month-old", 31 * DAY), listed("old-at-zero", 60 * DAY)];
  api.failures.set("insights:old-at-zero", serverError());

  assert.equal((await syncAccount(account())).insightsFailed, 1);
  assert.equal(api.calls("threads").length, 1);
  assert.deepEqual(
    insightCalls().map((r) => r.key),
    ["insights:old-at-zero"],
  );

  // A failed read by id may mean the post is gone, so the next try waits a day.
  await syncAccount(account());
  assert.equal(insightCalls().length, 1);
});

test("an interrupted first import keeps what it stored and lists everything again", async () => {
  api = createThreadsApi({ pageSize: 10 });
  globalThis.fetch.mock.mockImplementation(api.fetch);
  api.posts = Array.from({ length: 60 }, (_, i) => listed(`p${i}`, i * DAY + HOUR));
  for (const { id } of api.posts) api.insights.set(id, metrics(10));
  api.failures.set("insights:p55", expiredToken());

  assert.deepEqual(await syncAccount(account()), { error: "token_expired" });
  // Posts are written 50 at a time, so the first batch survives.
  assert.equal(rowsOf("post").length, 50);
  assert.equal(rowsOf("syncState").length, 0);

  api.failures.clear();
  const listedBefore = api.calls("threads").length;
  assert.equal((await syncAccount(account())).postsCount, 60);
  assert.equal(api.calls("threads").length - listedBefore, 6);
});

test("a read that throws starts none of the queued reads and leaves none running", async () => {
  api.posts = Array.from({ length: 50 }, (_, i) => listed(`p${i}`, HOUR));
  api.failures.set("insights:p0", expiredToken());

  assert.deepEqual(await syncAccount(account()), { error: "token_expired" });
  const reads = insightCalls().length;
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(insightCalls().length, reads);
  assert.ok(reads < 50, `${reads} reads`);
});

test("an expired token stops the sync without marking it done", async () => {
  api.posts = [listed("p1", HOUR)];
  api.failures.set("insights:p1", expiredToken());
  assert.deepEqual(await syncAccount(account()), { error: "token_expired" });
  assert.equal(rowsOf("syncState").length, 0);
  assert.equal(rowsOf("followerSnapshot").length, 0);
});

test("an account that can't sync says why without calling the API", async () => {
  assert.deepEqual(await syncAccount(account({ expiresAt: ago(1000) })), {
    error: "token_expired",
  });
  resetDb();
  const result = await syncAccount(account({ accessToken: "not a ciphertext" }));
  assert.match(result.error, /reconnect/);
  assert.equal(api.requests.length, 0);
});

test("a token without reply permission still syncs the posts", async () => {
  api.posts = [listed("p1", HOUR)];
  api.failures.set("replies", missingReplyPermission());
  assert.deepEqual(await syncAccount(account()), {
    postsCount: 1,
    repliesPermissionMissing: true,
  });
  assert.ok(rowsOf("syncState")[0].lastSyncedAt instanceof Date);
});

test("a failed reply pull keeps the reply window for the next sync to retry", async () => {
  const repliesSyncedAt = ago(3 * HOUR);
  rowsOf("syncState").push({ accountId: ACCOUNT_ID, lastSyncedAt: ago(3 * HOUR), repliesSyncedAt });
  api.posts = [listed("p1", HOUR)];
  api.failures.set("replies", serverError());

  assert.deepEqual(await syncAccount(account()), { postsCount: 1 });
  const [state] = rowsOf("syncState");
  assert.deepEqual(state.repliesSyncedAt, repliesSyncedAt);
  assert.ok(state.lastSyncedAt > repliesSyncedAt);
});

test("later reply pulls start a day early and refresh parts stored before", async () => {
  const repliesSyncedAt = ago(3 * HOUR);
  rowsOf("syncState").push({
    accountId: ACCOUNT_ID,
    lastSyncedAt: repliesSyncedAt,
    repliesSyncedAt,
  });
  rowsOf("post").push(stored("p1", 2 * DAY, metrics(100)), stored("old", 40 * DAY, metrics(100)));
  const part = (id, rootPostId, ageMs, values) => ({
    id,
    accountId: ACCOUNT_ID,
    rootPostId,
    repliedToId: rootPostId,
    position: 2,
    gapSeconds: 60,
    text: "",
    timestamp: ago(ageMs),
    mediaType: "TEXT_POST",
    permalink: "",
    syncedAt: ago(7 * HOUR),
    ...values,
  });
  rowsOf("threadReply").push(
    part("p1-2", "p1", 2 * DAY, metrics(5)),
    part("old-2", "old", 40 * DAY, metrics(5)),
  );
  api.posts = [listed("p1", 2 * DAY), listed("old", 40 * DAY)];
  api.insights.set("p1", metrics(100)).set("p1-2", metrics(30));

  await syncAccount(account());
  const [pull] = api.calls("replies");
  assert.equal(
    Number(pull.url.searchParams.get("since")),
    Math.floor((repliesSyncedAt.getTime() - DAY) / 1000),
  );
  // The pull returned nothing new, yet the young part was refreshed; the
  // settled one was not.
  assert.ok(api.calls("insights:p1-2").length === 1);
  assert.equal(api.calls("insights:old-2").length, 0);
  assert.equal(rowsOf("threadReply").find((row) => row.id === "p1-2").views, 30);
});

test("readings are spaced by the post's age, not taken every sync", async () => {
  api.posts = [listed("p1", HOUR)];
  api.insights.set("p1", metrics(100));
  await syncAccount(account());
  await syncAccount(account());
  assert.equal(insightCalls().length, 1);
  assert.equal(rowsOf("postMetricSnapshot").length, 1);

  // An hour-old post is due again fifteen minutes later.
  post("p1").syncedAt = ago(15 * 60_000);
  rowsOf("postMetricSnapshot")[0].capturedAt = ago(15 * 60_000);
  api.insights.set("p1", metrics(150));
  await syncAccount(account());
  assert.equal(post("p1").views, 150);
  assert.deepEqual(
    rowsOf("postMetricSnapshot").map((row) => row.views),
    [100, 150],
  );
});

test("demographics are fetched once a day while the count follows every sync", async () => {
  await syncAccount(account());
  assert.equal(demographicCalls().length, BREAKDOWNS.length);

  api.followersCount = 1005;
  await syncAccount(account());
  assert.equal(demographicCalls().length, BREAKDOWNS.length);
  const [snapshot] = rowsOf("followerSnapshot");
  assert.equal(snapshot.followersCount, 1005);
  assert.ok(snapshot.demographics);
});

test("an empty demographics day is retried after six hours, not on every sync", async () => {
  const snapshot = {
    accountId: ACCOUNT_ID,
    date: today(),
    followersCount: 1000,
    demographics: null,
  };
  rowsOf("followerSnapshot").push({ ...snapshot, capturedAt: ago(HOUR) });
  await syncAccount(account());
  assert.equal(demographicCalls().length, 0);

  resetDb();
  rowsOf("followerSnapshot").push({ ...snapshot, capturedAt: ago(7 * HOUR) });
  for (const breakdown of BREAKDOWNS) {
    api.failures.set(`follower_demographics:${breakdown}`, serverError());
  }
  await syncAccount(account());
  assert.equal(demographicCalls().length, BREAKDOWNS.length);
  // Still empty, but the attempt pushes the next retry back.
  const [retried] = rowsOf("followerSnapshot");
  assert.equal(retried.demographics, null);
  assert.ok(Date.now() - retried.capturedAt.getTime() < 5000);
});

test("accounts under 100 followers skip demographics", async () => {
  api.followersCount = 99;
  await syncAccount(account());
  assert.equal(demographicCalls().length, 0);
  assert.equal(rowsOf("followerSnapshot")[0].followersCount, 99);
});

test("a failed count falls back to the stored one, so a due retry still runs", async () => {
  rowsOf("followerSnapshot").push({
    accountId: ACCOUNT_ID,
    date: today(),
    followersCount: 1000,
    demographics: null,
    capturedAt: ago(7 * HOUR),
  });
  api.failures.set("followers_count", serverError());
  await syncAccount(account());
  // The due demographics retry still runs on the stored count.
  assert.equal(demographicCalls().length, BREAKDOWNS.length);
  const [snapshot] = rowsOf("followerSnapshot");
  assert.equal(snapshot.followersCount, 1000);
  assert.ok(snapshot.demographics);
});

test("syncAccounts reports each account in turn and carries on past a failure", async () => {
  api.posts = [listed("p1", HOUR)];
  const accounts = [account({ id: "2", username: "expired", expiresAt: ago(1000) }), account()];
  const reported = [];
  await syncAccounts(accounts, (synced, result) => reported.push([synced.username, result]));
  assert.deepEqual(reported, [
    ["expired", { error: "token_expired" }],
    ["someone", { postsCount: 1, threadRepliesCount: 0 }],
  ]);
  assert.ok(
    console.warn.mock.calls.some((call) => call.arguments[0] === "[sync] expired: token_expired"),
  );
});

test("a token renewed at the start of a sync is the one the sync uses", async () => {
  api.posts = [listed("p1", HOUR)];
  await syncAccount(account({ tokenRefreshedAt: null, tokenCheckedAt: null }));
  const [refresh, ...rest] = api.requests;
  assert.equal(refresh.key, "refresh");
  for (const request of rest) {
    assert.equal(request.url.searchParams.get("access_token"), "THAAG-renewed", request.key);
  }
});
