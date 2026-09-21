/**
 * Which of the author's replies are thread continuations — the "2/", "3/"
 * parts chained under one of their own root posts.
 *
 * /{user}/replies only ever returns replies the author wrote, so the parent of
 * each one is either a known root post, a known continuation, or something
 * that belongs to someone else. Only the first two extend a thread; a parent
 * outside the chain means the author was answering a commenter, and a root
 * that isn't theirs means they were commenting on another account's post.
 */

export interface ReplyCandidate {
  id: string;
  timestamp: string;
  rootPostId: string;
  repliedToId: string;
}

export interface ChainNode {
  rootPostId: string;
  position: number;
  timestamp: Date;
}

export interface ThreadPart<T extends ReplyCandidate> {
  reply: T;
  position: number;
  gapSeconds: number;
}

/** The root post is part 1, so the first continuation is part 2. */
export const ROOT_POSITION = 1;

export function classifyThreadReplies<T extends ReplyCandidate>(
  replies: T[],
  rootPosts: ReadonlyMap<string, Date>,
  knownParts: ReadonlyMap<string, ChainNode>,
): ThreadPart<T>[] {
  const chain = new Map<string, ChainNode>(knownParts);
  const parts: ThreadPart<T>[] = [];

  // Oldest first so a parent is always in the chain before its child.
  const ordered = [...replies].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  for (const reply of ordered) {
    const rootTimestamp = rootPosts.get(reply.rootPostId);
    if (!rootTimestamp) continue;

    let parent: ChainNode | undefined;
    if (reply.repliedToId === reply.rootPostId) {
      parent = { rootPostId: reply.rootPostId, position: ROOT_POSITION, timestamp: rootTimestamp };
    } else {
      const node = chain.get(reply.repliedToId);
      if (node && node.rootPostId === reply.rootPostId) parent = node;
    }
    if (!parent) continue;

    const timestamp = new Date(reply.timestamp);
    const gapSeconds = Math.max(
      0,
      Math.round((timestamp.getTime() - parent.timestamp.getTime()) / 1000),
    );
    const position = parent.position + 1;
    chain.set(reply.id, { rootPostId: reply.rootPostId, position, timestamp });
    parts.push({ reply, position, gapSeconds });
  }

  return parts;
}
