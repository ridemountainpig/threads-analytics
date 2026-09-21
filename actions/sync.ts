"use server";

import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncAccount, syncAllAccounts, type SyncResult } from "@/lib/sync-service";
import { withSyncLock } from "@/lib/sync-lock";
import { USER_INSIGHTS_TAG } from "@/lib/user-insights-cache";

// Syncs every connected account; the reported result is the active account's,
// which is the one the dashboard that triggered the sync is showing.
export async function syncDataAction(): Promise<SyncResult> {
  if (!(await getSession())) return { error: "Unauthorized" };

  const locked = await withSyncLock(() => syncAllAccounts());
  if (!locked.acquired) return { error: "sync_in_progress" };

  const results = locked.value;
  if (results.length === 0)
    return { error: "No active account. Please add a Threads account first." };

  if (results.some((r) => !r.error)) {
    // revalidatePath doesn't touch unstable_cache entries, so expire them too.
    updateTag(USER_INSIGHTS_TAG);
    revalidatePath("/dashboard");
  }

  const { postsCount, insightsFailed, threadRepliesCount, repliesPermissionMissing, error } =
    results[0];
  return { postsCount, insightsFailed, threadRepliesCount, repliesPermissionMissing, error };
}

// Syncs a specific account regardless of which one is active, so a newly
// added (inactive) account can get its first sync immediately.
export async function syncAccountAction(accountId: string): Promise<SyncResult> {
  if (!(await getSession())) return { error: "Unauthorized" };

  const account = await db.threadsAccount.findUnique({ where: { id: accountId } });
  if (!account) return { error: "Account not found" };

  const locked = await withSyncLock(() => syncAccount(account));
  if (!locked.acquired) return { error: "sync_in_progress" };

  const result = locked.value;

  if (!result.error) {
    // revalidatePath doesn't touch unstable_cache entries, so expire them too.
    updateTag(USER_INSIGHTS_TAG);
    revalidatePath("/dashboard");
  }

  return result;
}
