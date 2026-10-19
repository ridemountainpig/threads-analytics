"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { revokeClient } from "@/lib/oauth";

export async function revokeOAuthClientAction(clientId: string): Promise<{ error?: string }> {
  if (!(await getSession())) return { error: "Unauthorized" };
  await revokeClient(clientId);
  revalidatePath("/dashboard/settings");
  return {};
}
