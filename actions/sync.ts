"use server";

import { revalidatePath, updateTag } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncAccount, syncAccounts, type SyncResult } from "@/lib/sync-service";
import { withSyncLock } from "@/lib/sync-lock";
import { USER_INSIGHTS_TAG } from "@/lib/user-insights-cache";

// Syncs the account the dashboard is showing and reports its result. Every
// other connected account syncs after the response, so the button never waits
// on them, yet switching accounts still never lands on stale data and each
// token keeps getting renewed even with scheduled syncs turned off.
export async function syncDataAction(): Promise<SyncResult> {
  if (!(await getSession())) return { error: "Unauthorized" };

  const [active, ...others] = await db.threadsAccount.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });
  if (!active) return { error: "No active account. Please add a Threads account first." };

  // One lock hold covers every account, so nothing can slip in between the
  // active account and the rest; the response just doesn't wait for the rest.
  let reportActive!: (result: SyncResult) => void;
  const activeSynced = new Promise<SyncResult>((resolve) => (reportActive = resolve));
  const run = withSyncLock(() =>
    syncAccounts([active, ...others], (account, result) => {
      if (account === active) reportActive(result);
    }),
  );
  after(() => run);

  const result = await Promise.race([
    activeSynced,
    run.then((locked) => (locked.acquired ? activeSynced : null)),
  ]);
  if (!result) return { error: "sync_in_progress" };

  if (!result.error) {
    // revalidatePath doesn't touch unstable_cache entries, so expire them too.
    updateTag(USER_INSIGHTS_TAG);
    revalidatePath("/dashboard", "layout");
  }

  return result;
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
    revalidatePath("/dashboard", "layout");
  }

  return result;
}
