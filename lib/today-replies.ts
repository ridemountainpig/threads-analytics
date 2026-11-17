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

export interface UnrepliedComment extends InboxReply {
  // Visible replies under this comment, at any depth: how much discussion it drew.
  threadReplies: number;
}

export interface UnrepliedList {
  comments: UnrepliedComment[];
  answered: number;
}

export type UnrepliedSort = "newest" | "oldest" | "discussed";

/**
 * Every comment still waiting on the author across the given posts, whatever
 * its age: the "Replies today" rule from buildReplyInbox with no cut-off.
 */
export function buildUnrepliedList(conversations: readonly PostConversation[]): UnrepliedList {
  const inbox = buildReplyInbox(conversations, new Date(0));
  const awaitingIds = new Set(
    inbox.replies.filter((reply) => reply.status === "awaiting").map((reply) => reply.id),
  );

  const threadReplies = new Map<string, number>();
  for (const { postId, replies } of conversations) {
    const parentOf = new Map(replies.map((reply) => [reply.id, reply.repliedToId ?? postId]));
    for (const reply of replies) {
      if (reply.hidden || reply.ownedByMe) continue;
      // Credit every awaiting ancestor; the seen set guards against a malformed cycle.
      const seen = new Set<string>([reply.id]);
      let parent = parentOf.get(reply.id);
      while (parent && !seen.has(parent)) {
        seen.add(parent);
        if (awaitingIds.has(parent))
          threadReplies.set(parent, (threadReplies.get(parent) ?? 0) + 1);
        parent = parentOf.get(parent);
      }
    }
  }

  return {
    comments: inbox.replies
      .filter((reply) => reply.status === "awaiting")
      .map((reply) => ({ ...reply, threadReplies: threadReplies.get(reply.id) ?? 0 })),
    answered: inbox.answered,
  };
}

export function sortUnreplied<T extends Pick<UnrepliedComment, "timestamp" | "threadReplies">>(
  comments: readonly T[],
  sort: UnrepliedSort,
): T[] {
  const newestFirst = (a: T, b: T) => b.timestamp.localeCompare(a.timestamp);
  return [...comments].sort(
    sort === "oldest"
      ? (a, b) => -newestFirst(a, b)
      : sort === "discussed"
        ? (a, b) => b.threadReplies - a.threadReplies || newestFirst(a, b)
        : newestFirst,
  );
}
