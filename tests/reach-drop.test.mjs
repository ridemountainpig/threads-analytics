import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import test, { beforeEach } from "node:test";
import { resetDb, rowsOf } from "./support/fake-db.mjs";

// Follower snapshots are dated in DEFAULT_TZ, read from the environment when
// lib/analytics.ts is first imported. Account views go through unstable_cache,
// which outside a request needs Next's AsyncLocalStorage global and a cache;
// this one never holds anything.
process.env.NEXT_PUBLIC_ANALYTICS_TIME_ZONE = "Asia/Taipei";
delete process.env.NEXT_PUBLIC_RUNTIME_TARGET;
globalThis.AsyncLocalStorage = AsyncLocalStorage;
globalThis.__incrementalCache = {
  isOnDemandRevalidate: false,
  generateSimpleCacheKey: async (key) => key,
  get: async () => null,
  set: async () => {},
};
const { buildReachDropDiagnosis, defaultReachDropPeriods } = await import("../lib/reach-drop.ts");

const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;
const TZ = "Asia/Taipei";
// Noon on 19 October in Taipei: the default diagnosed period is 18 September
// to 15 October, compared with 21 August to 17 September.
const NOW = new Date("2026-10-19T04:00:00.000Z");
const ACCOUNT_ID = "1789";

beforeEach(() => resetDb());

const diagnose = (options = {}) =>
  buildReachDropDiagnosis({
    account: {
      id: ACCOUNT_ID,
      accessToken: "not-an-encrypted-token",
      syncState: { lastSyncedAt: NOW },
    },
    timezone: TZ,
    now: NOW,
    ...options,
  }).then((result) => {
    assert.ok("diagnosis" in result, JSON.stringify(result));
    return result.diagnosis;
  });

const shiftKey = (key, days) =>
  new Date(Date.parse(`${key}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
const taipei = (key, hour = 12) => new Date(`${key}T${String(hour).padStart(2, "0")}:00:00+08:00`);

/** A post published at noon in Taipei on `key`, last synced a week later unless `fields` says otherwise. */
function post(id, key, views, fields = {}) {
  const published = taipei(key, fields.hour ?? 12);
  delete fields.hour;
  rowsOf("post").push({
    id,
    accountId: ACCOUNT_ID,
    text: `post ${id}`,
    timestamp: published,
    mediaType: "TEXT_POST",
    permalink: `https://www.threads.com/@someone/post/${id}`,
    views,
    likes: 0,
    replies: 0,
    reposts: 0,
    quotes: 0,
    shares: 0,
    syncedAt: new Date(published.getTime() + 7 * DAY),
    ...fields,
  });
}

/** `count` posts `every` days apart from `firstKey`, with views from `viewsAt(i)`. */
function posts(prefix, firstKey, count, every, viewsAt, fields = {}) {
  for (let i = 0; i < count; i++) {
    post(`${prefix}${i}`, shiftKey(firstKey, i * every), viewsAt(i), { ...fields });
  }
}

function snapshotsThrough(firstKey, lastKey) {
  for (let key = firstKey; key <= lastKey; key = shiftKey(key, 1)) {
    rowsOf("followerSnapshot").push({
      accountId: ACCOUNT_ID,
      date: new Date(`${key}T00:00:00.000Z`),
      followersCount: 1000,
      demographics: null,
    });
  }
}

const check = (diagnosis, name) => diagnosis.checks.find((c) => c.check === name);

test("the default periods are the four whole weeks ending three days ago and the four before", async () => {
  const { diagnosed, comparison } = defaultReachDropPeriods(NOW, TZ);
  assert.equal(diagnosed.since.toISOString(), "2026-09-17T16:00:00.000Z");
  assert.equal(diagnosed.until.toISOString(), "2026-10-15T15:59:59.999Z");
  assert.equal(comparison.since.toISOString(), "2026-08-20T16:00:00.000Z");
  assert.equal(comparison.until.toISOString(), "2026-09-17T15:59:59.999Z");

  const { periods } = await diagnose();
  assert.deepEqual(
    [periods.diagnosed.firstDay, periods.diagnosed.lastDay, periods.diagnosed.days],
    ["2026-09-18", "2026-10-15", 28],
  );
  assert.deepEqual(
    [periods.comparison.firstDay, periods.comparison.lastDay, periods.comparison.days],
    ["2026-08-21", "2026-09-17", 28],
  );
});

test("fewer posts with steady views per post is a volume drop, not a reach drop", async () => {
  // The guide's example: total views fall by nearly 40%, the median holds.
  posts("c", "2026-08-21", 20, 1, () => 1800);
  posts("d", "2026-09-18", 12, 2, () => 1850);

  const diagnosis = await diagnose();
  assert.equal(diagnosis.verdict, "fewer_posts");
  assert.deepEqual(diagnosis.findings, ["fewer_posts"]);
  assert.deepEqual(diagnosis.summary.changePct, {
    posts: -40,
    totalViews: -38.3,
    medianViews: 2.8,
    averageViews: 2.8,
  });
  assert.equal(diagnosis.perPost.basis, "lifetime_views");
});

test("a lower median views per post is a drop in typical reach", async () => {
  posts("c", "2026-08-21", 20, 1, () => 2000);
  posts("d", "2026-09-18", 20, 1, () => 1000);

  const diagnosis = await diagnose();
  assert.equal(diagnosis.verdict, "lower_typical_reach");
  assert.deepEqual(diagnosis.findings, ["lower_typical_reach"]);
  assert.match(diagnosis.explanation, /changed -50% \(by lifetime views\)/);
});

test("losing the breakout posts pulls the average down while the median holds", async () => {
  posts("c", "2026-08-21", 20, 1, (i) => (i < 4 ? 10_000 : 1000));
  posts("d", "2026-09-18", 20, 1, () => 1000);

  const diagnosis = await diagnose();
  assert.equal(diagnosis.verdict, "fewer_breakouts");
  assert.deepEqual(diagnosis.findings, ["fewer_breakouts"]);
  assert.equal(diagnosis.perPost.breakoutThreshold, 2000);
  assert.equal(diagnosis.perPost.comparison.breakouts, 4);
  assert.equal(diagnosis.perPost.diagnosed.breakouts, 0);
  assert.equal(diagnosis.perPost.changePct.medianViews, 0);
  assert.equal(diagnosis.perPost.changePct.averageViews, -64.3);
});

test("steady posts and views is no drop", async () => {
  posts("c", "2026-08-21", 20, 1, () => 1000);
  posts("d", "2026-09-18", 20, 1, () => 1000);

  const diagnosis = await diagnose();
  assert.equal(diagnosis.verdict, "no_drop");
  assert.deepEqual(diagnosis.findings, []);
});

test("too few posts in a period gives no verdict", async () => {
  posts("c", "2026-08-21", 20, 1, () => 2000);
  posts("d", "2026-09-18", 3, 1, () => 100);

  const diagnosis = await diagnose();
  assert.equal(diagnosis.verdict, "insufficient_data");
  assert.deepEqual(diagnosis.findings, []);
  assert.equal(check(diagnosis, "format_mix").status, "not_enough_data");
});

test("posts are compared at 48 hours old when growth readings cover both periods", async () => {
  // Older posts kept collecting views for longer, but at 48 hours both did the same.
  posts("c", "2026-08-21", 6, 3, () => 3000);
  posts("d", "2026-09-18", 6, 3, () => 2000);
  const lifetimeOnly = await diagnose();
  assert.equal(lifetimeOnly.verdict, "lower_typical_reach");

  for (const { id, timestamp } of rowsOf("post")) {
    for (const [age, views] of [
      [24, 1000],
      [48, 1500],
    ]) {
      rowsOf("postMetricSnapshot").push({
        postId: id,
        capturedAt: new Date(timestamp.getTime() + age * HOUR),
        views,
        likes: 0,
        replies: 0,
        reposts: 0,
        quotes: 0,
        shares: 0,
      });
    }
  }
  const diagnosis = await diagnose();
  assert.equal(diagnosis.perPost.basis, "views_at_48h");
  assert.deepEqual(diagnosis.perPost.postsWithGrowthReadings, { diagnosed: 6, comparison: 6 });
  assert.equal(diagnosis.perPost.changePct.medianViews, 0);
  assert.equal(diagnosis.summary.changePct.medianViews, -33.3);
  assert.equal(diagnosis.verdict, "no_single_cause");
  assert.match(diagnosis.explanation, /longer to collect lifetime views/);
  assert.ok(!diagnosis.dataQuality.notes.some((note) => note.includes("lifetime views")));
});

test("the checks flag a format, rhythm, posting-time and link change", async () => {
  // In July, posts with a link did worse. Before: an image every other evening,
  // no links. After: text with a link in the morning, with a ten-day break.
  for (let i = 0; i < 20; i++) {
    const key = shiftKey("2026-07-01", i);
    if (i < 10) post(`h${i}`, key, 500, { text: `post h${i} https://example.com` });
    else post(`h${i}`, key, 1500);
  }
  posts("c", "2026-08-21", 14, 2, () => 3000, { mediaType: "IMAGE", hour: 20 });
  const text = (id) => `post ${id} https://example.com`;
  for (const [i, key] of [
    "2026-09-18",
    "2026-09-19",
    "2026-09-20",
    "2026-09-21",
    "2026-09-22",
    "2026-10-03",
    "2026-10-04",
    "2026-10-05",
    "2026-10-06",
    "2026-10-07",
  ].entries()) {
    post(`d${i}`, key, 1000, { text: text(i), hour: 8 });
  }
  snapshotsThrough("2026-08-17", "2026-10-19");

  const diagnosis = await diagnose();
  assert.equal(diagnosis.verdict, "lower_typical_reach");

  const format = check(diagnosis, "format_mix");
  assert.equal(format.status, "changed");
  assert.match(format.summary, /Media type TEXT_POST went from 0% to 100% of posts/);

  const rhythm = check(diagnosis, "posting_rhythm");
  assert.equal(rhythm.status, "changed");
  assert.equal(rhythm.diagnosed.longestGapDays, 10);
  assert.equal(rhythm.comparison.longestGapDays, 1);

  const time = check(diagnosis, "posting_time");
  assert.equal(time.status, "changed");
  assert.match(time.summary, /Posting in the morning went from 0% to 100% of posts/);
  assert.match(
    time.summary,
    /Posts in the hours that did best before the diagnosed period \(12, 20\) went from 100% to 0%/,
  );

  const features = check(diagnosis, "links_and_questions");
  assert.equal(features.status, "changed");
  assert.match(
    features.summary,
    /Posts with links went from 0% to 100%; in the 180 days before the diagnosed period, posts with links had 83% lower median views/,
  );
  assert.equal(features.features.find((f) => f.feature === "question").shareChangePp, 0);

  assert.equal(check(diagnosis, "data_and_platform").status, "stable");
});

test("missing syncs are flagged under data and platform", async () => {
  posts("c", "2026-08-21", 20, 1, () => 1000);
  posts("d", "2026-09-18", 20, 1, () => 1000);
  snapshotsThrough("2026-09-18", "2026-10-19");

  const diagnosis = await diagnose();
  const data = check(diagnosis, "data_and_platform");
  assert.equal(data.status, "changed");
  assert.match(data.summary, /Follower snapshots exist for 0 of 28 days in the comparison period/);
  assert.doesNotMatch(data.summary, /diagnosed period/);
});

test("posts read before they were 72 hours old count as posts but not toward views", async () => {
  posts("c", "2026-08-21", 6, 3, () => 1000);
  posts("d", "2026-09-18", 6, 3, () => 1000);
  const young = taipei("2026-10-14");
  post("fresh", "2026-10-14", 5, { syncedAt: new Date(young.getTime() + 10 * HOUR) });

  const diagnosis = await diagnose();
  assert.equal(diagnosis.summary.diagnosed.posts, 7);
  assert.equal(diagnosis.summary.diagnosed.postsWithSettledViews, 6);
  assert.equal(diagnosis.summary.diagnosed.medianViews, 1000);
  assert.ok(diagnosis.dataQuality.notes.some((note) => note.startsWith("1 post(s) were under")));
  assert.equal(diagnosis.verdict, "no_drop");
});

test("a comparison period that overlaps the diagnosed one is refused", async () => {
  const result = await buildReachDropDiagnosis({
    account: { id: ACCOUNT_ID, accessToken: "x", syncState: null },
    timezone: TZ,
    now: NOW,
    diagnosed: { since: taipei("2026-09-01", 0), until: taipei("2026-09-30", 23) },
    comparison: { since: taipei("2026-09-15", 0), until: taipei("2026-10-10", 23) },
  });
  assert.deepEqual(result, {
    error: "The comparison period must end before the diagnosed period starts.",
  });
});
