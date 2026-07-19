"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type TimeRange = "30" | "60" | "90";

export async function updateDefaultTimeRangeAction(value: TimeRange): Promise<void> {
  if (!(await getSession())) return;

  await db.appSettings.upsert({
    where: { key: "defaultTimeRange" },
    create: { key: "defaultTimeRange", value },
    update: { value },
  });
  revalidatePath("/dashboard");
}

export type SyncInterval = string;

export async function updateSyncIntervalAction(value: SyncInterval): Promise<{ error?: string }> {
  if (!(await getSession())) return { error: "Unauthorized" };

  const normalized = normalizeSyncInterval(value);
  if (!normalized) return { error: "Invalid sync interval" };

  await db.appSettings.upsert({
    where: { key: "syncInterval" },
    create: { key: "syncInterval", value: normalized },
    update: { value: normalized },
  });
  revalidatePath("/dashboard");
  return {};
}

function normalizeSyncInterval(value: string) {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;

  const minutes = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(minutes)) return null;
  if (minutes === 0) return "0";
  if (minutes < 1 || minutes > 10080) return null;

  return String(minutes);
}
