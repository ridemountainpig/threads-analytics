import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession, unauthorizedResponse } from "@/lib/api-auth";
import { getPostGrowthDetail } from "@/lib/post-growth-data";

// Fetched when a post is opened on the posts page, so the list itself doesn't
// carry every visible post's readings.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireApiSession())) return unauthorizedResponse();

  const { id } = await params;
  const account = await db.threadsAccount.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  if (!account) return NextResponse.json({ error: "No active account" }, { status: 404 });

  const growth = await getPostGrowthDetail(account.id, id);
  if (!growth) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json(growth);
}
