// Dependency-free so the test suite can run it with Node's type stripping.

import { classifyThreadReplies, type ChainNode, type ReplyCandidate } from "./thread-replies";

export interface ConversationReply {
  id: string;
  // Null for private profiles.
  username: string | null;
  text: string;
  timestamp: string;
  permalink: string;
  repliedToId: string | null;
  ownedByMe: boolean;
  hidden: boolean;
}

export interface PostConversation {
  postId: string;
  replies: ConversationReply[];
}

export type InboxStatus = "awaiting" | "answered" | "other";

export interface InboxReply {
  id: string;
  postId: string;
  username: string | null;
  text: string;
  timestamp: string;
  permalink: string;
  // "other": commenters replying to each other.
  status: InboxStatus;
}

export interface ReplyInbox {
  replies: InboxReply[];
  awaiting: number;
  answered: number;
  // Thread continuations excluded.
  authorReplies: number;
}

const HIDDEN_STATUSES = new Set(["HIDDEN", "COVERED", "BLOCKED", "RESTRICTED"]);

export function isHiddenStatus(hideStatus: string | undefined): boolean {
  return hideStatus !== undefined && HIDDEN_STATUSES.has(hideStatus);
}

export function buildReplyInbox(
  conversations: readonly PostConversation[],
  since: Date,
): ReplyInbox {
  const sinceMs = since.getTime();
  const isRecent = (reply: ConversationReply) => new Date(reply.timestamp).getTime() >= sinceMs;
  const inbox: ReplyInbox = { replies: [], awaiting: 0, answered: 0, authorReplies: 0 };

  for (const { postId, replies } of conversations) {
    const authorIds = new Set([postId]);
    const answeredIds = new Set<string>();
    for (const reply of replies) {
      if (!reply.ownedByMe) continue;
      authorIds.add(reply.id);
      if (reply.repliedToId) answeredIds.add(reply.repliedToId);
    }

    for (const reply of replies) {
      if (!isRecent(reply)) continue;
      const repliedTo = reply.repliedToId ?? postId;
      if (reply.ownedByMe) {
        // A reply to the post or to their own reply extends the thread.
        if (!authorIds.has(repliedTo)) inbox.authorReplies++;
        continue;
      }
      if (reply.hidden) continue;

      const status: InboxStatus = answeredIds.has(reply.id)
        ? "answered"
        : authorIds.has(repliedTo)
          ? "awaiting"
          : "other";
      if (status === "awaiting") inbox.awaiting++;
      if (status === "answered") inbox.answered++;
      inbox.replies.push({
        id: reply.id,
        postId,
        username: reply.username,
        text: reply.text,
        timestamp: reply.timestamp,
        permalink: reply.permalink,
        status,
      });
    }
  }

  inbox.replies.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return inbox;
}

export function replyRate(inbox: Pick<ReplyInbox, "awaiting" | "answered">): number | null {
  const total = inbox.awaiting + inbox.answered;
  return total === 0 ? null : Math.round((inbox.answered / total) * 100);
}

export interface AuthoredReply {
  id: string;
  text: string;
  timestamp: string;
  permalink: string;
  rootPostId: string | null;
  repliedToId: string | null;
}

export interface MyReply {
  id: string;
  text: string;
  timestamp: string;
  permalink: string;
  // Null under another account's post.
  ownPostId: string | null;
}

export function buildMyReplies(
  replies: readonly AuthoredReply[],
  rootPosts: ReadonlyMap<string, Date>,
  knownParts: ReadonlyMap<string, ChainNode>,
  since: Date,
): MyReply[] {
  const underOwnPosts = replies.filter(
    (reply): reply is AuthoredReply & ReplyCandidate =>
      reply.rootPostId !== null && reply.repliedToId !== null,
  );
  const continuations = new Set([
    ...knownParts.keys(),
    ...classifyThreadReplies(underOwnPosts, rootPosts, knownParts).map((part) => part.reply.id),
  ]);
  const sinceMs = since.getTime();
  return replies
    .filter(
      (reply) => !continuations.has(reply.id) && new Date(reply.timestamp).getTime() >= sinceMs,
    )
    .map((reply) => ({
      id: reply.id,
      text: reply.text,
      timestamp: reply.timestamp,
      permalink: reply.permalink,
      ownPostId: reply.rootPostId && rootPosts.has(reply.rootPostId) ? reply.rootPostId : null,
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
