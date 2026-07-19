"use server";

import { revalidatePath, refresh } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { encryptToken } from "@/lib/crypto";
import { getUser, TokenExpiredError } from "@/lib/threads-api";

export async function addAccountAction(
  formData: FormData,
): Promise<{ error?: string; username?: string; accountId?: string; shouldSync?: boolean }> {
  if (!(await getSession())) return { error: "Unauthorized" };

  const accessToken = (formData.get("accessToken") as string)?.trim();
  if (!accessToken) return { error: "Access token is required" };

  try {
    const user = await getUser(accessToken);

    const encrypted = encryptToken(accessToken);
    const isFirst = (await db.threadsAccount.count()) === 0;
    const account = await db.threadsAccount.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        username: user.username,
        accessToken: encrypted,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: isFirst,
      },
      update: {
        username: user.username,
        accessToken: encrypted,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
      include: { syncState: true },
    });

    revalidatePath("/dashboard");
    // Kick off the first sync from the client whenever this account has never
    // synced — even for non-active accounts, so switching to them later
    // doesn't land on an empty dashboard.
    return {
      username: user.username,
      accountId: account.id,
      shouldSync: !account.syncState?.lastSyncedAt,
    };
  } catch (err) {
    if (err instanceof TokenExpiredError) return { error: "Token is invalid or expired" };
    console.error("[addAccountAction] unexpected error:", err);
    return { error: "Failed to verify token. Please check and try again." };
  }
}

export async function updateTokenAction(
  accountId: string,
  formData: FormData,
): Promise<{ error?: string; username?: string }> {
  if (!(await getSession())) return { error: "Unauthorized" };

  const accessToken = (formData.get("accessToken") as string)?.trim();
  if (!accessToken) return { error: "Access token is required" };

  const account = await db.threadsAccount.findUnique({ where: { id: accountId } });
  if (!account) return { error: "Account not found" };

  try {
    const user = await getUser(accessToken);
    if (user.id !== accountId) {
      return { error: `This token belongs to @${user.username}, not @${account.username}` };
    }

    await db.threadsAccount.update({
      where: { id: accountId },
      data: {
        username: user.username,
        accessToken: encryptToken(accessToken),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    });

    revalidatePath("/dashboard");
    return { username: user.username };
  } catch (err) {
    if (err instanceof TokenExpiredError) return { error: "Token is invalid or expired" };
    console.error("[updateTokenAction] unexpected error:", err);
    return { error: "Failed to verify token. Please check and try again." };
  }
}

export async function deleteAccountAction(accountId: string): Promise<void> {
  if (!(await getSession())) return;

  const account = await db.threadsAccount.findUnique({ where: { id: accountId } });
  if (!account) return;

  await db.threadsAccount.delete({ where: { id: accountId } });

  if (account.isActive) {
    const next = await db.threadsAccount.findFirst({ orderBy: { createdAt: "asc" } });
    if (next) {
      await db.threadsAccount.update({ where: { id: next.id }, data: { isActive: true } });
    }
  }
  revalidatePath("/dashboard");
}

export async function switchAccountAction(accountId: string): Promise<{ shouldSync?: boolean }> {
  if (!(await getSession())) return {};

  const account = await db.threadsAccount.findUnique({
    where: { id: accountId },
    include: { syncState: true },
  });
  if (!account) return {};

  await db.$transaction([
    db.threadsAccount.updateMany({ data: { isActive: false } }),
    db.threadsAccount.update({ where: { id: accountId }, data: { isActive: true } }),
  ]);
  refresh();
  // Safety net for accounts that never got a first sync (added before the
  // auto-sync existed, or whose first sync failed).
  return { shouldSync: !account.syncState?.lastSyncedAt };
}
