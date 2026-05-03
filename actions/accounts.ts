"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { encryptToken, decryptToken } from "@/lib/crypto";
import { getUser, TokenExpiredError } from "@/lib/threads-api";

export async function addAccountAction(
  formData: FormData,
): Promise<{ error?: string; username?: string }> {
  if (!(await getSession())) return { error: "Unauthorized" };

  const accessToken = (formData.get("accessToken") as string)?.trim();
  if (!accessToken) return { error: "Access token is required" };

  try {
    const user = await getUser(accessToken);

    const encrypted = encryptToken(accessToken);
    const isFirst = (await db.threadsAccount.count()) === 0;
    await db.threadsAccount.upsert({
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
    });

    revalidatePath("/dashboard");
    return { username: user.username };
  } catch (err) {
    if (err instanceof TokenExpiredError) return { error: "Token is invalid or expired" };
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

export async function switchAccountAction(accountId: string): Promise<void> {
  if (!(await getSession())) return;

  await db.$transaction([
    db.threadsAccount.updateMany({ data: { isActive: false } }),
    db.threadsAccount.update({ where: { id: accountId }, data: { isActive: true } }),
  ]);
  revalidatePath("/dashboard");
}

export async function getActiveToken(): Promise<{ token: string; userId: string } | null> {
  if (!(await getSession())) return null;

  const account = await db.threadsAccount.findFirst({ where: { isActive: true } });
  if (!account) return null;
  if (account.expiresAt < new Date()) return null;
  return { token: decryptToken(account.accessToken), userId: account.id };
}
