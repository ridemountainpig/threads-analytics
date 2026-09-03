"use server";

import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncActiveAccount, type SyncResult } from "@/lib/sync-service";
import { withSyncLock } from "@/lib/sync-lock";
import { USER_INSIGHTS_TAG } from "@/lib/user-insights-cache";

export async function syncDataAction(): Promise<SyncResult> {
  if (!(await getSession())) return { error: "Unauthorized" };

  const locked = await withSyncLock(() => syncActiveAccount());
  if (!locked.acquired) return { error: "sync_in_progress" };

  const result = locked.value;

  if (!result.error) {
    // revalidatePath doesn't touch unstable_cache entries, so expire them too.
    updateTag(USER_INSIGHTS_TAG);
    revalidatePath("/dashboard");
  }

  return result;
}

// Syncs a specific account regardless of which one is active, so a newly
// added (inactive) account can get its first sync immediately.
export async function syncAccountAction(accountId: string): Promise<SyncResult> {
  if (!(await getSession())) return { error: "Unauthorized" };

  const account = await db.threadsAccount.findUnique({ where: { id: accountId } });
  if (!account) return { error: "Account not found" };

  const locked = await withSyncLock(() => syncActiveAccount(account));
  if (!locked.acquired) return { error: "sync_in_progress" };

  const result = locked.value;

  if (!result.error) {
    // revalidatePath doesn't touch unstable_cache entries, so expire them too.
    updateTag(USER_INSIGHTS_TAG);
    revalidatePath("/dashboard");
  }

  return result;
}
