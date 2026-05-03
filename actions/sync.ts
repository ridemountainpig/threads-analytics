"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { syncActiveAccount, type SyncResult } from "@/lib/sync-service";

export async function syncDataAction(): Promise<SyncResult> {
  if (!(await getSession())) return { error: "Unauthorized" };

  const result = await syncActiveAccount();

  if (!result.error) {
    revalidatePath("/dashboard");
  }

  return result;
}
