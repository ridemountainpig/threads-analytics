import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession, unauthorizedResponse } from "@/lib/api-auth";

export async function GET() {
  if (!(await requireApiSession())) return unauthorizedResponse();

  const account = await db.threadsAccount.findFirst({
    where: { isActive: true },
    include: { syncState: true },
  });

  if (!account) {
    return NextResponse.json({ isConfigured: false });
  }

  return NextResponse.json({
    isConfigured: true,
    username: account.username,
    lastSyncedAt: account.syncState?.lastSyncedAt ?? null,
    tokenExpiresAt: account.expiresAt,
  });
}
