import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { resetDb, rowsOf } from "./support/fake-db.mjs";

delete process.env.NEXT_PUBLIC_RUNTIME_TARGET;
const { registerMcpServer } = await import("../lib/mcp-server.ts");

const tools = new Map();
registerMcpServer({
  registerTool: (name, _config, handler) => tools.set(name, handler),
  registerPrompt: () => {},
});

beforeEach(() => resetDb());

async function callTool(name, args) {
  const result = await tools.get(name)(args);
  return { isError: result.isError ?? false, body: JSON.parse(result.content[0].text) };
}

test("a date past the end of its month is refused, not read as the next month's", async () => {
  rowsOf("threadsAccount").push({ id: "1789", username: "someone", isActive: true });
  rowsOf("post").push({
    id: "march",
    accountId: "1789",
    text: "posted on 2 March",
    timestamp: new Date("2026-03-02T02:00:00Z"),
    mediaType: "TEXT_POST",
    permalink: "",
    views: 100,
    likes: 0,
    replies: 0,
    reposts: 0,
    quotes: 0,
    shares: 0,
  });
  const listFebruary = (until) =>
    callTool("list_posts", { since: "2026-02-01", until, timezone: "Asia/Taipei" });

  for (const until of ["2026-02-30", "2026-02-31", "2026-02-31T10:00:00Z", "2026-02-31T10:00"]) {
    const { isError, body } = await listFebruary(until);
    assert.equal(isError, true, until);
    assert.deepEqual(body, { error: "Invalid date parameters" }, until);
  }
  for (const until of ["2026-02-28", "2026-02-28T23:59:59Z"]) {
    const { isError, body } = await listFebruary(until);
    assert.equal(isError, false, until);
    assert.equal(body.total, 0, until);
  }
});

function seedAccount() {
  rowsOf("threadsAccount").push({ id: "1789", username: "someone", isActive: true });
}

function seedPost(overrides) {
  const post = {
    accountId: "1789",
    text: "a post",
    timestamp: new Date(),
    mediaType: "TEXT_POST",
    permalink: "https://www.threads.net/@someone/post/1",
    views: 1000,
    likes: 10,
    replies: 2,
    reposts: 1,
    quotes: 0,
    shares: 3,
    syncedAt: new Date(),
    ...overrides,
  };
  rowsOf("post").push(post);
  return post;
}

function seedPart(overrides) {
  const part = {
    accountId: "1789",
    mediaType: "TEXT_POST",
    permalink: "https://www.threads.net/@someone/post/2",
    gapSeconds: 30,
    timestamp: new Date(),
    views: 400,
    likes: 1,
    replies: 0,
    reposts: 0,
    quotes: 0,
    shares: 0,
    ...overrides,
  };
  rowsOf("threadReply").push(part);
  return part;
}

test("get_thread returns every part with its retention, and get_post counts them", async () => {
  seedAccount();
  seedPost({ id: "root", views: 1000 });
  seedPart({ id: "part2", rootPostId: "root", position: 2, text: "the second part", views: 400 });
  seedPart({ id: "part3", rootPostId: "root", position: 3, text: "the third part", views: 250 });
  // Another account's part must never be folded into the thread.
  rowsOf("threadsAccount").push({ id: "other", username: "elsewhere", isActive: false });
  seedPart({ id: "stray", accountId: "other", rootPostId: "root", position: 2, text: "nope" });

  const { isError, body } = await callTool("get_thread", { account: "someone", id: "root" });
  assert.equal(isError, false);
  assert.equal(body.partCount, 2);
  assert.deepEqual(
    body.parts.map((part) => [part.id, part.position, part.retentionPct]),
    [
      ["part2", 2, 40],
      ["part3", 3, 25],
    ],
  );
  assert.equal(body.parts[0].text, "the second part");
  assert.equal(body.part2Retention.kind, "text");
  assert.equal(body.part2Retention.retentionPct, 40);

  const post = await callTool("get_post", { account: "someone", id: "root" });
  assert.equal(post.body.threadPartCount, 2);
});

test("get_thread says so when a post has no parts, and refuses another account's post", async () => {
  seedAccount();
  seedPost({ id: "lonely" });
  const { isError, body } = await callTool("get_thread", { id: "lonely" });
  assert.equal(isError, false);
  assert.equal(body.partCount, 0);
  assert.match(body.note, /no continuation parts/);
  assert.deepEqual(body.parts, []);

  const missing = await callTool("get_thread", { id: "someone-elses" });
  assert.equal(missing.isError, true);
  assert.deepEqual(missing.body, { error: "Post someone-elses not found." });
});

test("get_post_benchmark refuses a post outside an explicit range", async () => {
  seedAccount();
  seedPost({ id: "old", timestamp: new Date("2026-01-05T00:00:00Z") });
  const { isError, body } = await callTool("get_post_benchmark", {
    id: "old",
    since: "2026-03-01",
    until: "2026-03-31",
    timezone: "Asia/Taipei",
  });
  assert.equal(isError, true);
  assert.match(body.error, /outside the requested range/);
});
