"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { decryptToken } from "@/lib/crypto";
import {
  getAllReplies,
  MissingReplyPermissionError,
  TokenExpiredError,
  type ThreadsReply,
} from "@/lib/threads-api";

export type GiveawayReplyError =
  | "unauthorized"
  | "not_found"
  | "token_expired"
  | "missing_permission"
  | "credentials_unavailable"
  | "failed";

export interface GiveawayRepliesResult {
  replies?: ThreadsReply[];
  truncated?: boolean;
  error?: GiveawayReplyError;
}

export async function fetchGiveawayRepliesAction(postId: string): Promise<GiveawayRepliesResult> {
  if (!(await getSession())) return { error: "unauthorized" };

  const account = await db.threadsAccount.findFirst({ where: { isActive: true } });
  if (!account) return { error: "not_found" };
  if (account.expiresAt < new Date()) return { error: "token_expired" };

  // Only draw on the active account's own posts — the conversation endpoint
  // would reject foreign ids anyway, but fail fast with a clear error.
  const post = await db.post.findFirst({
    where: { id: postId, accountId: account.id },
    select: { id: true },
  });
  if (!post) return { error: "not_found" };

  let accessToken: string;
  try {
    accessToken = decryptToken(account.accessToken);
  } catch {
    return { error: "credentials_unavailable" };
  }

  try {
    const { replies, truncated } = await getAllReplies(post.id, accessToken);
    // The host replying to entrants must not win their own giveaway.
    const own = account.username.toLowerCase();
    return {
      replies: replies.filter((r) => r.username.toLowerCase() !== own),
      truncated,
    };
  } catch (err) {
    if (err instanceof TokenExpiredError) return { error: "token_expired" };
    if (err instanceof MissingReplyPermissionError) return { error: "missing_permission" };
    console.warn(
      `[giveaway] fetching replies failed for ${postId}:`,
      err instanceof Error ? err.message : err,
    );
    return { error: "failed" };
  }
}
