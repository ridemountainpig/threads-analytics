import assert from "node:assert/strict";
import test from "node:test";

// Snapshot days are bucketed in DEFAULT_TZ, which lib/analytics.ts reads from
// the environment on import; pin it so a developer's own setting can't leak in.
delete process.env.NEXT_PUBLIC_RUNTIME_TARGET;
process.env.NEXT_PUBLIC_ANALYTICS_TIME_ZONE = "Asia/Taipei";
const {
  compareDemographics,
  computeDemographicTrend,
  computeFollowerRangeTrend,
  computeFollowerTrend,
  followerChangeBetween,
  groupPostsByDay,
  parseDemographics,
  snapshotDays,
  summarizeFollowerGrowth,
} = await import("../lib/followers.ts");

/** A wall clock reading in Taipei (UTC+8). */
const tpe = (iso) => new Date(Date.parse(`${iso}+08:00`));

/** A snapshot row as Prisma returns it: the calendar day pinned to UTC midnight. */
const snapshot = (day, followersCount) => ({
  date: new Date(`${day}T00:00:00Z`),
  followersCount,
});
const point = (date, followers) => ({ date, followers });

test("a range covers the snapshot days whose close falls inside it", () => {
  const later = tpe("2026-10-10T12:00:00");
  // Ending on a day's last millisecond counts that day.
  assert.deepEqual(
    snapshotDays(
      { since: tpe("2026-10-01T00:00:00"), until: tpe("2026-10-05T23:59:59.999") },
      later,
    ),
    { firstKey: "2026-10-01", lastKey: "2026-10-05" },
  );
  // Ending partway through a past day leaves that day to the next range.
  assert.deepEqual(
    snapshotDays({ since: tpe("2026-10-01T15:00:00"), until: tpe("2026-10-05T15:00:00") }, later),
    { firstKey: "2026-10-01", lastKey: "2026-10-04" },
  );
});

test("a range running to the present includes today's snapshot", () => {
  const now = tpe("2026-10-06T15:00:00");
  assert.equal(
    snapshotDays({ since: tpe("2026-09-07T15:00:00"), until: now }, now).lastKey,
    "2026-10-06",
  );
  // "Now" read just before midnight, with the request finishing just after.
  const until = tpe("2026-10-05T23:59:30");
  const justAfter = tpe("2026-10-06T00:00:10");
  assert.equal(
    snapshotDays({ since: tpe("2026-09-06T00:00:00"), until }, justAfter).lastKey,
    "2026-10-05",
  );
});

test("the follower change opens on the snapshot before the range", () => {
  const snapshots = [
    point("2026-09-27", 90),
    point("2026-09-30", 100),
    point("2026-10-01", 104),
    point("2026-10-03", 110),
  ];
  const change = followerChangeBetween(snapshots, "2026-10-01", "2026-10-07");
  assert.equal(change.opening, snapshots[1]);
  assert.equal(change.closing, snapshots[3]);
  assert.equal(change.net, 10);

  // Missed syncs before the range are bridged from up to three days back...
  const bridged = followerChangeBetween(snapshots, "2026-09-30", "2026-10-07");
  assert.equal(bridged.opening.date, "2026-09-27");
  // ...but no further: then the range's own first snapshot is the start.
  const late = followerChangeBetween(
    [point("2026-09-20", 50), ...snapshots.slice(2)],
    "2026-10-01",
    "2026-10-07",
  );
  assert.equal(late.opening, null);
  assert.equal(late.net, 6);
});

test("a single snapshot has no change to report", () => {
  assert.equal(
    followerChangeBetween([point("2026-10-02", 100)], "2026-10-01", "2026-10-07").net,
    null,
  );
});

test("each trend point measures its change from the previous snapshot", () => {
  const trend = computeFollowerTrend([
    snapshot("2026-10-04", 130),
    snapshot("2026-10-01", 100),
    snapshot("2026-10-02", 120),
  ]);
  assert.deepEqual(trend, [
    { date: "2026-10-01", followers: 100, change: null },
    { date: "2026-10-02", followers: 120, change: 20 },
    // Missed syncs are called out, so the change isn't read as one day's.
    { date: "2026-10-04", followers: 130, change: 10, changeSince: "2026-10-02" },
  ]);
});

test("a range trend measures its first day from the opening snapshot", () => {
  const snapshots = [
    snapshot("2026-09-28", 80),
    snapshot("2026-10-01", 100),
    snapshot("2026-10-02", 105),
  ];
  const { trend, opening } = computeFollowerRangeTrend(snapshots, "2026-10-01", "2026-10-07");
  assert.equal(opening.date, "2026-09-28");
  assert.deepEqual(trend, [
    { date: "2026-10-01", followers: 100, change: 20, changeSince: "2026-09-28" },
    { date: "2026-10-02", followers: 105, change: 5 },
  ]);
  assert.deepEqual(computeFollowerRangeTrend(snapshots, "2026-11-01", "2026-11-07"), {
    trend: [],
    opening: null,
  });
});

test("growth is averaged over the days elapsed, not the snapshots taken", () => {
  // Two snapshots eleven days apart: 110 followers is 10 a day, not 110.
  const trend = [
    { date: "2026-10-01", followers: 1000, change: null },
    { date: "2026-10-12", followers: 1110, change: 110 },
  ];
  assert.deepEqual(summarizeFollowerGrowth(trend), {
    current: 1110,
    net: 110,
    netPct: 11,
    avgPerDay: 10,
    days: 2,
  });
  const opening = { date: "2026-09-30", followers: 990, change: null };
  assert.equal(summarizeFollowerGrowth(trend, opening).net, 120);
  assert.deepEqual(summarizeFollowerGrowth(trend.slice(0, 1)), {
    current: 1000,
    net: null,
    netPct: null,
    avgPerDay: null,
    days: 1,
  });
  assert.equal(summarizeFollowerGrowth([]), null);
});

test("demographics read both the current and the legacy snapshot shape", () => {
  const parsed = parseDemographics({
    // Legacy: a bare entry list, whose total can only be summed.
    country: [
      { key: "TW", value: 60 },
      { key: "JP", value: 20 },
    ],
    // A stored total below the visible entries would push shares past 100%.
    age: { total: 10, entries: [{ key: "25-34", value: 30 }] },
    gender: { total: 100, entries: [{ key: "F", value: 55 }, { key: "bad" }, null] },
  });
  assert.deepEqual(parsed, {
    country: {
      total: 80,
      entries: [
        { key: "TW", value: 60 },
        { key: "JP", value: 20 },
      ],
    },
    city: { total: 0, entries: [] },
    age: { total: 30, entries: [{ key: "25-34", value: 30 }] },
    gender: { total: 100, entries: [{ key: "F", value: 55 }] },
  });
  assert.equal(parseDemographics({ country: [], city: { entries: [] } }), null);
  assert.equal(parseDemographics([{ key: "TW", value: 1 }]), null);
  assert.equal(parseDemographics(null), null);
});

test("demographic rows compare shares in percentage points", () => {
  const current = {
    total: 200,
    entries: [
      { key: "JP", value: 50 },
      { key: "TW", value: 120 },
      { key: "US", value: 30 },
    ],
  };
  const baseline = {
    total: 100,
    entries: [
      { key: "TW", value: 70 },
      { key: "JP", value: 30 },
    ],
  };
  assert.deepEqual(compareDemographics(current, baseline, 2), [
    // TW gained 50 followers yet lost 10 points of share.
    {
      key: "TW",
      value: 120,
      share: 60,
      previousValue: 70,
      previousShare: 70,
      valueChange: 50,
      shareChange: -10,
    },
    {
      key: "JP",
      value: 50,
      share: 25,
      previousValue: 30,
      previousShare: 30,
      valueChange: 20,
      shareChange: -5,
    },
  ]);
  // A key the baseline lacked counts as having been zero.
  const us = compareDemographics(current, baseline).find((row) => row.key === "US");
  assert.equal(us.previousValue, 0);
  assert.equal(us.shareChange, 15);
  // A baseline without entries is a fetch that missed this dimension, not a
  // breakdown where everything was zero, so nothing is compared against it.
  assert.deepEqual(compareDemographics(current, { total: 0, entries: [] }, 1), [
    { key: "TW", value: 120, share: 60 },
  ]);
  assert.deepEqual(compareDemographics({ total: 0, entries: [] }, baseline), []);
});

test("the demographic trend re-bases each share at the first usable snapshot", () => {
  const day = (date, entries) => ({
    date: new Date(`${date}T00:00:00Z`),
    demographics: { country: entries },
  });
  const result = computeDemographicTrend(
    [
      day("2026-09-30", []), // a missed fetch, skipped
      day("2026-10-01", [
        { key: "TW", value: 50 },
        { key: "JP", value: 50 },
        { key: "US", value: 0 },
      ]),
      day("2026-10-02", [
        { key: "TW", value: 60 },
        { key: "JP", value: 40 },
        { key: "US", value: 0 },
      ]),
    ],
    "country",
  );
  // US never moved, so it isn't drawn on top of the zero line.
  assert.deepEqual(result, {
    keys: ["TW", "JP"],
    rows: [
      { date: "2026-10-01", TW: 0, JP: 0 },
      { date: "2026-10-02", TW: 10, JP: -10 },
    ],
  });
  assert.deepEqual(
    computeDemographicTrend([day("2026-10-01", [{ key: "TW", value: 1 }])], "country"),
    {
      keys: [],
      rows: [],
    },
  );
});

test("posts are grouped by snapshot day, busiest first", () => {
  const posts = [
    { id: "a", text: "", views: 10, timestamp: tpe("2026-10-01T23:30:00") },
    { id: "b", text: "", views: 30, timestamp: tpe("2026-10-02T00:30:00") },
    { id: "c", text: "", views: 20, timestamp: tpe("2026-10-02T12:00:00") },
    { id: "d", text: "", views: 40, timestamp: tpe("2026-10-02T18:00:00") },
    { id: "e", text: "", views: 99, timestamp: tpe("2026-10-03T12:00:00") },
  ];
  const grouped = groupPostsByDay(posts, "Asia/Taipei", ["2026-10-01", "2026-10-02"], 2);
  assert.deepEqual(Object.keys(grouped).sort(), ["2026-10-01", "2026-10-02"]);
  assert.deepEqual(grouped["2026-10-02"], {
    top: [
      { id: "d", text: "", views: 40 },
      { id: "b", text: "", views: 30 },
    ],
    count: 3,
  });
});
