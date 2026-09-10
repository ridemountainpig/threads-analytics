"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { revokeClient } from "@/lib/oauth";

export async function revokeOAuthClientAction(clientId: string): Promise<void> {
  if (!(await getSession())) return;
  await revokeClient(clientId);
  revalidatePath("/dashboard/settings");
}
