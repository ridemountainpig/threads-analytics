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

test("diagnose_reach_drop needs both ends of a custom comparison period", async () => {
  rowsOf("threadsAccount").push({ id: "1789", username: "someone", isActive: true });
  const { isError, body } = await callTool("diagnose_reach_drop", {
    since: "2026-09-01",
    until: "2026-09-30",
    compare_since: "2026-08-01",
  });
  assert.equal(isError, true);
  assert.deepEqual(body, { error: "Provide both compare_since and compare_until, or neither." });
});

test("diagnose_reach_drop refuses a comparison period that overlaps the diagnosed one", async () => {
  rowsOf("threadsAccount").push({ id: "1789", username: "someone", isActive: true });
  const { isError, body } = await callTool("diagnose_reach_drop", {
    since: "2026-09-01",
    until: "2026-09-30",
    compare_since: "2026-09-15",
    compare_until: "2026-10-10",
    timezone: "Asia/Taipei",
  });
  assert.equal(isError, true);
  assert.deepEqual(body, {
    error: "The comparison period must end before the diagnosed period starts.",
  });
});
