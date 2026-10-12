import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import test, { beforeEach } from "node:test";
import { resetDb, rowsOf } from "./support/fake-db.mjs";

// Follower snapshots are dated in DEFAULT_TZ, read from the environment when
// lib/analytics.ts is first imported. Account views go through unstable_cache,
// which outside a request needs Next's AsyncLocalStorage global and a cache;
// this one never holds anything, so every read reaches Threads.
process.env.NEXT_PUBLIC_ANALYTICS_TIME_ZONE = "Asia/Taipei";
delete process.env.NEXT_PUBLIC_RUNTIME_TARGET;
globalThis.AsyncLocalStorage = AsyncLocalStorage;
globalThis.__incrementalCache = {
  isOnDemandRevalidate: false,
  generateSimpleCacheKey: async (key) => key,
  get: async () => null,
  set: async () => {},
};
const { buildMonthlyReview, lastCompleteMonth } = await import("../lib/monthly-review.ts");
const { encryptToken } = await import("../lib/crypto.ts");

const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;
const TZ = "Asia/Taipei";
// Noon on 12 October in Taipei.
const NOW = new Date("2026-10-12T04:00:00.000Z");
const ACCOUNT_ID = "1789";
const UNREADABLE = "not-an-encrypted-token";

beforeEach(() => resetDb());

const review = ({ accessToken = UNREADABLE, ...options } = {}) =>
  buildMonthlyReview({
    account: { id: ACCOUNT_ID, accessToken, syncState: { lastSyncedAt: NOW } },
    timezone: TZ,
    baselineMonths: 3,
    now: NOW,
    ...options,
  });

/** A post published at `timestamp`, last synced a week later unless `fields` says otherwise. */
function post(id, timestamp, views, fields = {}) {
  const published = new Date(timestamp);
  rowsOf("post").push({
    id,
    accountId: ACCOUNT_ID,
    text: `post ${id}`,
    timestamp: published,
    mediaType: "TEXT_POST",
    permalink: `https://www.threads.com/@someone/post/${id}`,
    views,
    likes: views / 10,
    replies: views / 100,
    reposts: 0,
    quotes: 0,
    shares: views / 50,
    syncedAt: new Date(published.getTime() + 7 * DAY),
    ...fields,
  });
}

/** Two August posts, and three September ones whose edges sit on Taipei's month boundaries. */
function seedAugustAndSeptember() {
  post("a1", "2026-08-05T02:00:00Z", 1000);
  post("a2", "2026-08-20T02:00:00Z", 3400);
  post("s1", "2026-08-31T16:30:00Z", 2000, { mediaType: "IMAGE" });
  post("s2", "2026-09-10T02:00:00Z", 4000);
  post("s3", "2026-09-30T15:59:00Z", 500);
  post("o1", "2026-09-30T16:00:00Z", 800);
  post("repost", "2026-09-15T02:00:00Z", 9999, { mediaType: "REPOST_FACADE" });
}

function snapshot(date, followersCount) {
  rowsOf("followerSnapshot").push({
    accountId: ACCOUNT_ID,
    date: new Date(`${date}T00:00:00.000Z`),
    followersCount,
    demographics: null,
  });
}

function threadPart(id, rootPostId, position, views, publishedAfterRoot) {
  const root = rowsOf("post").find((row) => row.id === rootPostId);
  rowsOf("threadReply").push({
    id,
    accountId: ACCOUNT_ID,
    rootPostId,
    position,
    text: `part ${id}`,
    views,
    timestamp: new Date(root.timestamp.getTime() + publishedAfterRoot),
  });
}

const ids = (posts) => posts.map((p) => p.id);

test("the default month is the last one complete in the review's time zone", async () => {
  const taipeiMidnight = new Date("2026-09-30T16:30:00Z");
  assert.equal(lastCompleteMonth(taipeiMidnight, "Asia/Taipei"), "2026-09");
  assert.equal(lastCompleteMonth(taipeiMidnight, "UTC"), "2026-08");
  assert.equal(lastCompleteMonth(new Date("2026-01-01T03:00:00Z"), "UTC"), "2025-12");

  seedAugustAndSeptember();
  assert.equal((await review()).review.month, "2026-09");
});

test("a month holds the posts published on its days in the review's time zone", async () => {
  seedAugustAndSeptember();
  const taipei = (await review({ month: "2026-09" })).review;
  assert.deepEqual(taipei.range, {
    since: "2026-08-31T16:00:00.000Z",
    until: "2026-09-30T15:59:59.999Z",
  });
  assert.deepEqual(ids(taipei.topPosts), ["s2", "s1", "s3"]);

  const losAngeles = (await review({ month: "2026-09", timezone: "America/Los_Angeles" })).review;
  assert.deepEqual(losAngeles.range, {
    since: "2026-09-01T07:00:00.000Z",
    until: "2026-10-01T06:59:59.999Z",
  });
  assert.deepEqual(ids(losAngeles.topPosts), ["s2", "o1", "s3"]);
});

test("months outside the synced history, or malformed, are refused", async () => {
  seedAugustAndSeptember();
  post("old-repost", "2026-07-01T02:00:00Z", 10, { mediaType: "REPOST_FACADE" });
  const errorFor = async (options) => (await review(options)).error;

  assert.equal(await errorFor({ month: "2026-13" }), 'Invalid month "2026-13"; use YYYY-MM.');
  assert.equal(await errorFor({ month: "2026-9" }), 'Invalid month "2026-9"; use YYYY-MM.');
  assert.equal(await errorFor({ month: "2026-11" }), "2026-11 is in the future.");
  assert.equal(
    await errorFor({ month: "2026-07" }),
    "The earliest post is from 2026-08; pick 2026-08 or later.",
  );
  assert.equal(
    await errorFor({ month: "2026-09", compareMonth: "2026-8" }),
    'Invalid compare_month "2026-8"; use YYYY-MM.',
  );
  assert.equal(
    await errorFor({ month: "2026-09", compareMonth: "2026-09" }),
    "compare_month must be earlier than month.",
  );
  assert.equal(
    await errorFor({ month: "2026-09", compareMonth: "2026-07" }),
    "The earliest post is from 2026-08; compare_month must be 2026-08 or later.",
  );

  resetDb();
  post("only-repost", "2026-09-15T02:00:00Z", 10, { mediaType: "REPOST_FACADE" });
  assert.equal(
    await errorFor({ month: "2026-09" }),
    "No posts have been synced for this account yet.",
  );
});

test("KPIs are compared with the previous month and the months with posts before it", async () => {
  seedAugustAndSeptember();
  const { review: september } = await review({ month: "2026-09" });
  assert.equal(september.compareMonth, "2026-08");
  assert.deepEqual(september.baselineMonths, ["2026-08"]);

  const values = Object.fromEntries(
    Object.entries(september.kpis).map(([metric, kpi]) => [metric, kpi.value]),
  );
  assert.deepEqual(values, {
    postsCount: 3,
    activeDays: 3,
    accountViews: null,
    newPostViews: 6500,
    medianViews: 2000,
    p75Views: 4000,
    hitRate: 33.3,
    engagementRate: 11,
    replyRate: 1,
    repostRate: 0,
    shareRate: 2,
    followersNet: null,
    followersPer1kViews: null,
    threadCount: 0,
    part2Retention: null,
    longestGapDays: 19,
  });
  assert.deepEqual(september.kpis.postsCount, {
    value: 3,
    compareValue: 2,
    baselineAvg: 2,
    vsComparePct: 50,
    vsBaselinePct: 50,
  });
  assert.equal(september.kpis.hitRate.compareValue, 50);
  assert.equal(september.kpis.longestGapDays.compareValue, 14);

  assert.deepEqual(september.topPosts[0], {
    id: "s2",
    date: "2026-09-10",
    mediaType: "TEXT_POST",
    text: "post s2",
    views: 4000,
    likes: 400,
    replies: 40,
    reposts: 0,
    quotes: 0,
    shares: 80,
    engagementRatePct: 11,
    vsBaselineMedian: 1.8,
    isThread: false,
    permalink: "https://www.threads.com/@someone/post/s2",
  });
  assert.deepEqual(september.contentMix.byMediaType, [
    {
      key: "TEXT_POST",
      posts: 2,
      sharePct: 66.7,
      medianViews: 2250,
      baselineSharePct: 100,
      baselineMedianViews: 2200,
    },
    {
      key: "IMAGE",
      posts: 1,
      sharePct: 33.3,
      medianViews: 2000,
      baselineSharePct: 0,
      baselineMedianViews: null,
    },
  ]);
  assert.deepEqual(
    september.weekly.map((week) => [week.from, week.to, week.posts, week.newPostViews]),
    [
      ["2026-09-01", "2026-09-07", 1, 2000],
      ["2026-09-08", "2026-09-14", 1, 4000],
      ["2026-09-15", "2026-09-21", 0, 0],
      ["2026-09-22", "2026-09-28", 0, 0],
      ["2026-09-29", "2026-09-30", 1, 500],
    ],
  );
  assert.ok(
    september.dataQuality.notes.includes("Only 1 of the requested 3 baseline months have posts."),
  );
});

test("a compare_month a year back leaves the baseline on the months just before", async () => {
  seedAugustAndSeptember();
  post("last-year", "2025-09-15T02:00:00Z", 1500);
  const { review: september } = await review({ month: "2026-09", compareMonth: "2025-09" });
  assert.equal(september.compareMonth, "2025-09");
  assert.deepEqual(september.baselineMonths, ["2026-06", "2026-07", "2026-08"]);
  assert.equal(september.kpis.postsCount.compareValue, 1);
  assert.equal(september.kpis.newPostViews.compareValue, 1500);
  // June and July had no posts, so they count as months of none.
  assert.equal(september.kpis.postsCount.baselineAvg, 0.67);
});

test("a month still in progress counts only the days so far", async () => {
  seedAugustAndSeptember();
  post("o2", new Date(NOW.getTime() - 3 * HOUR), 300, { syncedAt: NOW });
  const { review: october } = await review({ month: "2026-10" });
  assert.equal(october.dataQuality.isComplete, false);
  assert.equal(october.dataQuality.daysCovered, 12);
  assert.equal(october.dataQuality.daysInMonth, 31);
  assert.equal(october.kpis.longestGapDays.value, 10);
  assert.deepEqual(
    october.weekly.map((week) => [week.from, week.to]),
    [
      ["2026-10-01", "2026-10-07"],
      ["2026-10-08", "2026-10-12"],
    ],
  );
  assert.equal(
    october.dataQuality.notes[0],
    "2026-10 is still in progress (12 of 31 days), so counts and totals are not comparable to full months yet.",
  );
});

test("posts under 72 hours old at their last sync are flagged and kept out of the bottom", async () => {
  const published = (n) => `2026-09-${String(n + 1).padStart(2, "0")}T02:00:00Z`;
  for (let n = 1; n <= 8; n++) post(`p${n}`, published(n), n * 100);
  rowsOf("post").find((p) => p.id === "p8").syncedAt = new Date(Date.parse(published(8)) + DAY);
  rowsOf("post").find((p) => p.id === "p1").syncedAt = new Date(
    Date.parse(published(1)) + 71 * HOUR,
  );
  rowsOf("post").find((p) => p.id === "p2").syncedAt = new Date(
    Date.parse(published(2)) + 72 * HOUR,
  );

  const { review: september } = await review({ month: "2026-09" });
  assert.deepEqual(ids(september.topPosts), ["p8", "p7", "p6", "p5", "p4"]);
  assert.equal(september.topPosts[0].stillGrowing, true);
  assert.equal(september.topPosts[1].stillGrowing, undefined);
  assert.deepEqual(ids(september.bottomPosts), ["p2", "p3"]);
  assert.equal(september.dataQuality.immaturePosts, 2);
  assert.ok(
    september.dataQuality.notes.includes(
      "2 post(s) were under 72 hours old at their last sync; their numbers are still growing, so treat this month's views as a floor.",
    ),
  );
});

test("a thread's second part is its earliest reply at position 2", async () => {
  seedAugustAndSeptember();
  threadPart("a1-2", "a1", 2, 500, 60_000);
  threadPart("s1-2", "s1", 2, 1000, 60_000);
  threadPart("s1-2-again", "s1", 2, 1900, HOUR);
  threadPart("s2-2", "s2", 2, 1000, 60_000);
  threadPart("s2-3", "s2", 3, 3900, 2 * 60_000);

  const { review: september } = await review({ month: "2026-09" });
  assert.equal(september.kpis.threadCount.value, 2);
  assert.equal(september.kpis.threadCount.compareValue, 1);
  assert.deepEqual(september.threads, {
    count: 2,
    part2RetentionMedian: 37.5,
    baselinePart2RetentionMedian: 50,
    threadMedianViews: 3000,
    singlePostMedianViews: 500,
  });
  assert.deepEqual(
    september.topPosts.map((p) => [p.id, p.isThread]),
    [
      ["s2", true],
      ["s1", true],
      ["s3", false],
    ],
  );
});

test("follower change runs from the snapshot before the month to its last day", async () => {
  seedAugustAndSeptember();
  snapshot("2026-08-27", 980);
  snapshot("2026-08-31", 1000);
  snapshot("2026-09-01", 1010);
  snapshot("2026-09-02", 1030);
  snapshot("2026-09-30", 1100);
  snapshot("2026-10-01", 1200);

  const { review: september } = await review({ month: "2026-09" });
  assert.equal(september.kpis.followersNet.value, 100);
  assert.equal(september.kpis.followersNet.compareValue, 20);
  assert.deepEqual(september.followers.measuredFrom, { date: "2026-08-31", followers: 1000 });
  assert.deepEqual(september.followers.measuredTo, { date: "2026-09-30", followers: 1100 });
  // 30 September follows 2 September, so its gain spans several days and isn't a day's.
  const s1 = { id: "s1", date: "2026-09-01", text: "post s1", views: 2000 };
  assert.deepEqual(september.followers.topGainDays, [
    { date: "2026-09-02", gain: 20, posts: [s1] },
    { date: "2026-09-01", gain: 10, posts: [s1] },
  ]);
  assert.ok(
    september.dataQuality.notes.includes(
      "Follower snapshots exist for 3 of 30 days (one is written per day the dashboard syncs).",
    ),
  );

  rowsOf("followerSnapshot").splice(0, 2);
  const { review: unopened } = await review({ month: "2026-09" });
  assert.equal(unopened.kpis.followersNet.value, 90);
  assert.ok(
    unopened.dataQuality.notes.includes(
      "No snapshot exists from just before the month, so follower change is measured from 2026-09-01; any growth before that day is not included.",
    ),
  );
});

test("experiments are judged against the month before, or their target", async () => {
  seedAugustAndSeptember();
  post("last-year", "2025-09-15T02:00:00Z", 1500);
  threadPart("s2-2", "s2", 2, 1000, 60_000);
  const experiments = [
    { metric: "postsCount", direction: "up" },
    { metric: "postsCount", direction: "down" },
    { metric: "medianViews", direction: "up" },
    { metric: "engagementRate", direction: "up" },
    { metric: "newPostViews", direction: "up", target: 7000 },
    { metric: "newPostViews", direction: "down", target: 7000 },
    { metric: "threadCount", direction: "up" },
    { metric: "repostRate", direction: "up" },
    { metric: "followersNet", direction: "up" },
  ];
  const { review: september } = await review({
    month: "2026-09",
    compareMonth: "2025-09",
    experiments,
  });
  assert.deepEqual(
    september.experimentResults.map(({ baselineValue, actual, changePct, result }) => [
      baselineValue,
      actual,
      changePct,
      result,
    ]),
    [
      [2, 3, 50, "hit"],
      [2, 3, 50, "miss"],
      [2200, 2000, -9.1, "miss"],
      [11, 11, 0, "flat"],
      [4400, 6500, 47.7, "miss"],
      [4400, 6500, 47.7, "hit"],
      [0, 1, null, "hit"],
      [0, 0, null, "flat"],
      [null, null, null, "no_data"],
    ],
  );
});

test("account views are each month's total from Threads, up to now", async (t) => {
  process.env.TOKEN_ENCRYPTION_KEY = "test-encryption-key";
  seedAugustAndSeptember();
  snapshot("2026-08-31", 1000);
  snapshot("2026-09-30", 1100);
  const monthViews = { "2026-08": 10_000, "2026-09": 20_000, "2026-10": 3_000 };
  const requested = new Map();
  t.mock.method(globalThis, "fetch", async (input) => {
    const url = new URL(String(input));
    const since = Number(url.searchParams.get("since"));
    const until = Number(url.searchParams.get("until"));
    const month = new Date(since * 1000 + 8 * HOUR).toISOString().slice(0, 7);
    requested.set(month, until);
    const values = [{ end_time: new Date(until * 1000).toISOString(), value: monthViews[month] }];
    return Response.json({ data: [{ name: "views", period: "day", values, title: "Views" }] });
  });
  const accessToken = encryptToken("THAAG-current");

  const { review: september } = await review({ month: "2026-09", accessToken });
  assert.equal(september.kpis.accountViews.value, 20_000);
  assert.equal(september.kpis.accountViews.compareValue, 10_000);
  assert.equal(september.kpis.followersPer1kViews.value, 5);
  assert.equal(september.followers.per1kViews, 5);
  assert.equal(requested.get("2026-09"), Math.floor(Date.parse("2026-09-30T15:59:59.999Z") / 1000));

  const { review: october } = await review({ month: "2026-10", accessToken });
  assert.equal(october.kpis.accountViews.value, 3_000);
  assert.equal(requested.get("2026-10"), NOW.getTime() / 1000);

  const { review: unreadable } = await review({ month: "2026-09" });
  assert.equal(unreadable.kpis.accountViews.value, null);
  assert.ok(
    unreadable.dataQuality.notes.includes(
      "Account credentials are unavailable, so accountViews is missing.",
    ),
  );
});
