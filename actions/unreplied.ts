"use server";

import { updateTag } from "next/cache";
import { getSession } from "@/lib/auth";
import { UNREPLIED_TAG } from "@/lib/unreplied-data";

// Rereads every conversation on the next render, e.g. right after replying on Threads.
export async function refreshUnrepliedAction(): Promise<void> {
  if (!(await getSession())) return;
  updateTag(UNREPLIED_TAG);
}
