import assert from "node:assert/strict";
import test from "node:test";
import { classifyThreadReplies } from "../lib/thread-replies.ts";

const root = (id, iso) => [id, new Date(iso)];

const reply = (id, iso, rootPostId, repliedToId) => ({
  id,
  timestamp: iso,
  rootPostId,
  repliedToId,
});

const summarize = (parts) => parts.map((part) => [part.reply.id, part.position, part.gapSeconds]);

test("replies chained under the author's own post become its later parts", () => {
  const roots = new Map([root("r1", "2026-10-01T10:00:00Z")]);
  const parts = classifyThreadReplies(
    [
      // Out of order: a part can arrive before its parent in the API response.
      reply("p3", "2026-10-01T10:05:00Z", "r1", "p2"),
      reply("p2", "2026-10-01T10:01:30Z", "r1", "r1"),
    ],
    roots,
    new Map(),
  );
  assert.deepEqual(summarize(parts), [
    ["p2", 2, 90],
    ["p3", 3, 210],
  ]);
});

test("answers to commenters and comments on other accounts are not thread parts", () => {
  const roots = new Map([root("r1", "2026-10-01T10:00:00Z")]);
  const parts = classifyThreadReplies(
    [
      reply("p2", "2026-10-01T10:01:00Z", "r1", "r1"),
      // Replying to someone else's comment under the author's post.
      reply("answer", "2026-10-01T11:00:00Z", "r1", "someone-elses-comment"),
      // Replying under a post the author doesn't own.
      reply("elsewhere", "2026-10-01T12:00:00Z", "other-root", "other-root"),
      // A reply to that answer is still a conversation, not a thread part.
      reply("follow-up", "2026-10-01T12:30:00Z", "r1", "answer"),
    ],
    roots,
    new Map(),
  );
  assert.deepEqual(summarize(parts), [["p2", 2, 60]]);
});

test("parts stored by an earlier sync extend the chain", () => {
  const roots = new Map([root("r1", "2026-10-01T10:00:00Z"), root("r2", "2026-10-02T10:00:00Z")]);
  const known = new Map([
    ["p3", { rootPostId: "r1", position: 3, timestamp: new Date("2026-10-01T10:10:00Z") }],
  ]);
  const parts = classifyThreadReplies(
    [
      reply("p4", "2026-10-01T10:12:00Z", "r1", "p3"),
      // A known part of another thread is not a parent under r2.
      reply("stray", "2026-10-02T10:01:00Z", "r2", "p3"),
    ],
    roots,
    known,
  );
  assert.deepEqual(summarize(parts), [["p4", 4, 120]]);
  // The caller's map is left as it was.
  assert.deepEqual([...known.keys()], ["p3"]);
});

test("a part timestamped before its parent has no negative gap", () => {
  const roots = new Map([root("r1", "2026-10-01T10:00:00Z")]);
  const parts = classifyThreadReplies(
    [reply("p2", "2026-10-01T09:59:58Z", "r1", "r1")],
    roots,
    new Map(),
  );
  assert.deepEqual(summarize(parts), [["p2", 2, 0]]);
});
