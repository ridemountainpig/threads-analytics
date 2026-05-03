import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession, unauthorizedResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  if (!(await requireApiSession())) return unauthorizedResponse();

  const { searchParams } = request.nextUrl;
  const sinceParam = searchParams.get("since");
  const untilParam = searchParams.get("until");
  const sort = searchParams.get("sort") ?? "date";

  const sinceTs = sinceParam ? Number(sinceParam) : null;
  const untilTs = untilParam ? Number(untilParam) : null;

  if (
    (sinceTs !== null && !Number.isFinite(sinceTs)) ||
    (untilTs !== null && !Number.isFinite(untilTs))
  ) {
    return NextResponse.json({ error: "Invalid date parameters" }, { status: 400 });
  }

  const until = untilTs !== null ? new Date(untilTs * 1000) : new Date();
  const since =
    sinceTs !== null ? new Date(sinceTs * 1000) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const account = await db.threadsAccount.findFirst({ where: { isActive: true } });
  if (!account) return NextResponse.json({ error: "No active account" }, { status: 404 });

  const orderBy =
    sort === "views"
      ? { views: "desc" as const }
      : sort === "likes"
        ? { likes: "desc" as const }
        : { timestamp: "desc" as const };

  const posts = await db.post.findMany({
    where: {
      accountId: account.id,
      timestamp: { gte: since, lte: until },
      mediaType: { not: "REPOST_FACADE" },
    },
    orderBy,
    take: 2000,
  });

  return NextResponse.json({ posts });
}
