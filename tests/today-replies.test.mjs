import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMyReplies,
  buildReplyInbox,
  buildUnrepliedList,
  isHiddenStatus,
  replyRate,
  sortUnreplied,
} from "../lib/today-replies.ts";

const since = new Date("2026-10-11T16:00:00Z");
const today = (minute) =>
  `2026-10-12T0${Math.floor(minute / 60)}:${String(minute % 60).padStart(2, "0")}:00+0000`;
const yesterday = "2026-10-11T12:00:00+0000";

const reply = (id, repliedToId, { minute = 0, ownedByMe = false, hidden = false, at } = {}) => ({
  id,
  username: ownedByMe ? "me" : `user_${id}`,
  text: `text ${id}`,
  timestamp: at ?? today(minute),
  permalink: `https://threads.net/p/${id}`,
  repliedToId,
  ownedByMe,
  hidden,
});

const statuses = (inbox) => Object.fromEntries(inbox.replies.map((r) => [r.id, r.status]));

test("a reply to the post waits until the author answers it", () => {
  const inbox = buildReplyInbox(
    [
      {
        postId: "post",
        replies: [
          reply("a", "post", { minute: 1 }),
          reply("b", "post", { minute: 2 }),
          reply("me1", "a", { minute: 3, ownedByMe: true }),
        ],
      },
    ],
    since,
  );
  assert.deepEqual(statuses(inbox), { a: "answered", b: "awaiting" });
  assert.equal(inbox.awaiting, 1);
  assert.equal(inbox.answered, 1);
  assert.equal(inbox.authorReplies, 1);
});

test("a follow-up to the author's reply is aimed at them again", () => {
  const inbox = buildReplyInbox(
    [
      {
        postId: "post",
        replies: [
          reply("a", "post", { minute: 1 }),
          reply("me1", "a", { minute: 2, ownedByMe: true }),
          reply("a2", "me1", { minute: 3 }),
        ],
      },
    ],
    since,
  );
  assert.equal(statuses(inbox).a2, "awaiting");
});

test("commenters talking among themselves don't wait on the author", () => {
  const inbox = buildReplyInbox(
    [
      {
        postId: "post",
        replies: [reply("a", "post", { minute: 1 }), reply("b", "a", { minute: 2 })],
      },
    ],
    since,
  );
  assert.deepEqual(statuses(inbox), { a: "awaiting", b: "other" });
  assert.equal(inbox.awaiting, 1);
});

test("thread continuations are not counted as replies to people", () => {
  const inbox = buildReplyInbox(
    [
      {
        postId: "post",
        replies: [
          reply("part2", "post", { minute: 1, ownedByMe: true }),
          reply("part3", "part2", { minute: 2, ownedByMe: true }),
          reply("a", "part3", { minute: 3 }),
        ],
      },
    ],
    since,
  );
  assert.equal(inbox.authorReplies, 0);
  assert.equal(statuses(inbox).a, "awaiting");
});

test("only replies since the cutoff are listed, but older answers still count", () => {
  const inbox = buildReplyInbox(
    [
      {
        postId: "post",
        replies: [
          reply("old", "post", { at: yesterday }),
          reply("me-old", "old", { at: yesterday, ownedByMe: true }),
          reply("new", "old", { minute: 5 }),
        ],
      },
    ],
    since,
  );
  assert.deepEqual(statuses(inbox), { new: "other" });
  assert.equal(inbox.authorReplies, 0);
});

test("hidden replies stay out of the inbox", () => {
  const inbox = buildReplyInbox(
    [{ postId: "post", replies: [reply("a", "post", { minute: 1, hidden: true })] }],
    since,
  );
  assert.equal(inbox.replies.length, 0);
  assert.equal(inbox.awaiting, 0);
  assert.equal(isHiddenStatus("HIDDEN"), true);
  assert.equal(isHiddenStatus("NOT_HUSHED"), false);
  assert.equal(isHiddenStatus(undefined), false);
});

test("replies from every post are merged newest first", () => {
  const inbox = buildReplyInbox(
    [
      { postId: "p1", replies: [reply("a", "p1", { minute: 1 })] },
      { postId: "p2", replies: [reply("b", "p2", { minute: 9 })] },
    ],
    since,
  );
  assert.deepEqual(
    inbox.replies.map((r) => [r.id, r.postId]),
    [
      ["b", "p2"],
      ["a", "p1"],
    ],
  );
});

test("reply rate covers only replies aimed at the author", () => {
  assert.equal(replyRate({ awaiting: 1, answered: 3 }), 75);
  assert.equal(replyRate({ awaiting: 0, answered: 0 }), null);
});

const authored = (id, rootPostId, repliedToId, minute) => ({
  id,
  text: `text ${id}`,
  timestamp: today(minute),
  permalink: `https://threads.net/p/${id}`,
  rootPostId,
  repliedToId,
});

test("my replies keep comments anywhere but drop thread parts", () => {
  const rootPosts = new Map([["mine", new Date("2026-10-12T00:00:00Z")]]);
  const knownParts = new Map([
    ["old-part", { rootPostId: "mine", position: 2, timestamp: new Date("2026-10-11T12:00:00Z") }],
  ]);
  const replies = buildMyReplies(
    [
      authored("part2", "mine", "mine", 1),
      authored("part3", "mine", "part2", 2),
      authored("after-old", "mine", "old-part", 3),
      authored("to-commenter", "mine", "comment", 4),
      authored("elsewhere", "theirs", "theirs", 5),
      authored("no-roots", null, null, 7),
      authored("old-part", "mine", "mine", 6),
      { ...authored("yesterday", "theirs", "theirs", 0), timestamp: yesterday },
    ],
    rootPosts,
    knownParts,
    since,
  );
  assert.deepEqual(
    replies.map((r) => [r.id, r.ownPostId]),
    [
      ["no-roots", null],
      ["elsewhere", null],
      ["to-commenter", "mine"],
    ],
  );
});

test("unreplied list keeps every awaiting comment regardless of age", () => {
  const list = buildUnrepliedList([
    {
      postId: "post",
      replies: [
        reply("old", "post", { at: "2026-09-01T00:00:00+0000" }),
        reply("answered", "post", { minute: 1 }),
        reply("me1", "answered", { minute: 2, ownedByMe: true }),
        reply("followup", "me1", { minute: 3 }),
        reply("chat", "old", { minute: 4 }),
        reply("chat2", "chat", { minute: 5 }),
        reply("spam", "post", { minute: 6, hidden: true }),
      ],
    },
  ]);
  assert.deepEqual(
    list.comments.map((c) => c.id),
    ["followup", "old"],
  );
  assert.equal(list.answered, 1);
  const old = list.comments.find((c) => c.id === "old");
  assert.equal(old.threadReplies, 2, "counts nested replies under the comment");
  assert.equal(list.comments.find((c) => c.id === "followup").threadReplies, 0);
});

test("unreplied sort orders by time or by discussion", () => {
  const items = [
    { id: "a", timestamp: "2026-10-01T00:00:00.000Z", threadReplies: 0 },
    { id: "b", timestamp: "2026-10-03T00:00:00.000Z", threadReplies: 1 },
    { id: "c", timestamp: "2026-10-02T00:00:00.000Z", threadReplies: 5 },
    { id: "d", timestamp: "2026-10-04T00:00:00.000Z", threadReplies: 1 },
  ];
  const ids = (sort) => sortUnreplied(items, sort).map((i) => i.id);
  assert.deepEqual(ids("newest"), ["d", "b", "c", "a"]);
  assert.deepEqual(ids("oldest"), ["a", "c", "b", "d"]);
  assert.deepEqual(ids("discussed"), ["c", "d", "b", "a"]);
});
