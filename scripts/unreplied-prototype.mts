// Prototype: list unreplied comments under one post.
// Usage:
//   THREADS_TOKEN=... node --experimental-strip-types scripts/unreplied-prototype.mts <media_id>
//   node --experimental-strip-types scripts/unreplied-prototype.mts --fixture   (offline demo)
//
// Reuses the "Replies Today" awaiting rule from lib/today-replies.ts, minus the
// "today only" cut-off. Also probes whether reply objects expose a like count.

import { buildReplyInbox, type ConversationReply } from "../lib/today-replies.ts";

const BASE = "https://graph.threads.net/v1.0";
const FIELDS =
  "id,username,text,timestamp,permalink,replied_to,is_reply_owned_by_me,hide_status";

async function get(path: string, params: Record<string, string>) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  const body = await res.text();
  return { ok: res.ok, status: res.status, json: JSON.parse(body) };
}

async function fetchConversation(mediaId: string, token: string): Promise<ConversationReply[]> {
  const out: ConversationReply[] = [];
  let after: string | undefined;
  for (let page = 0; page < 10; page++) {
    const params: Record<string, string> = { fields: FIELDS, limit: "100", access_token: token };
    if (after) params.after = after;
    const r = await get(`/${mediaId}/conversation`, params);
    if (!r.ok) throw new Error(`conversation ${r.status}: ${JSON.stringify(r.json)}`);
    for (const it of r.json.data ?? []) {
      out.push({
        id: it.id,
        username: it.username ?? null,
        text: it.text ?? "",
        timestamp: new Date(it.timestamp).toISOString(),
        permalink: it.permalink ?? "",
        repliedToId: it.replied_to?.id ?? null,
        ownedByMe: it.is_reply_owned_by_me === true,
        hidden: ["HIDDEN", "COVERED", "BLOCKED", "RESTRICTED"].includes(it.hide_status),
      });
    }
    after = r.json.paging?.next ? r.json.paging?.cursors?.after : undefined;
    if (!after) break;
  }
  return out;
}

// Probe: does a reply object accept like_count, or do insights work on someone else's reply?
async function probeLikes(replyId: string, token: string) {
  const field = await get(`/${replyId}`, { fields: "id,like_count", access_token: token });
  const insights = await get(`/${replyId}/insights`, { metric: "likes", access_token: token });
  console.log("probe like_count field:", field.status, JSON.stringify(field.json).slice(0, 200));
  console.log("probe insights likes:  ", insights.status, JSON.stringify(insights.json).slice(0, 200));
}

const POST = "post1";
const fixture: ConversationReply[] = [
  { id: "a", username: "amy", text: "好文！", timestamp: "2026-11-10T03:00:00Z", permalink: "https://threads.net/a", repliedToId: POST, ownedByMe: false, hidden: false },
  { id: "me1", username: "me", text: "謝謝", timestamp: "2026-11-10T04:00:00Z", permalink: "https://threads.net/me1", repliedToId: "a", ownedByMe: true, hidden: false },
  { id: "b", username: "bob", text: "請問用什麼工具？", timestamp: "2026-11-16T09:00:00Z", permalink: "https://threads.net/b", repliedToId: POST, ownedByMe: false, hidden: false },
  { id: "c", username: "cat", text: "@bob 我也想知道", timestamp: "2026-11-16T10:00:00Z", permalink: "https://threads.net/c", repliedToId: "b", ownedByMe: false, hidden: false },
  { id: "d", username: "amy", text: "追問：那價格呢？", timestamp: "2026-11-16T12:00:00Z", permalink: "https://threads.net/d", repliedToId: "me1", ownedByMe: false, hidden: false },
  { id: "e", username: "spam", text: "加我", timestamp: "2026-11-16T13:00:00Z", permalink: "https://threads.net/e", repliedToId: POST, ownedByMe: false, hidden: true },
];

const arg = process.argv[2];
const token = process.env.THREADS_TOKEN;
let mediaId = POST;
let replies = fixture;
if (arg && arg !== "--fixture") {
  if (!token) throw new Error("set THREADS_TOKEN");
  mediaId = arg;
  replies = await fetchConversation(mediaId, token);
}

const inbox = buildReplyInbox([{ postId: mediaId, replies }], new Date(0));
const awaiting = inbox.replies.filter((r) => r.status === "awaiting");
console.log(`共 ${replies.length} 則留言，未回覆 ${awaiting.length}，已回覆 ${inbox.answered}`);
for (const r of awaiting) console.log(`- ${r.timestamp}  @${r.username ?? "(私人)"}  ${r.text}  ${r.permalink}`);

const firstOther = replies.find((r) => !r.ownedByMe);
if (token && firstOther && arg !== "--fixture") await probeLikes(firstOther.id, token);
