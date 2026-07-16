"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { syncActiveAccount, type SyncResult } from "@/lib/sync-service";
import { withSyncLock } from "@/lib/sync-lock";

export async function syncDataAction(): Promise<SyncResult> {
  if (!(await getSession())) return { error: "Unauthorized" };

  const locked = await withSyncLock(() => syncActiveAccount());
  if (!locked.acquired) return { error: "sync_in_progress" };

  const result = locked.value;

  if (!result.error) {
    revalidatePath("/dashboard");
  }

  return result;
}
