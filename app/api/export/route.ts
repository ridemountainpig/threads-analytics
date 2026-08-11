import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma";
import { requireApiSession, unauthorizedResponse } from "@/lib/api-auth";
import { getTimeRange } from "@/lib/time-range";
import { resolveRangeParams } from "@/lib/time-range-server";
import { getServerTimezone } from "@/lib/server-timezone";

const SORT_KEYS = ["date", "views", "likes", "replies", "shares", "engRate"] as const;
type SortKey = (typeof SORT_KEYS)[number];
// Guard against unbounded responses on very large accounts.
const EXPORT_LIMIT = 10_000;

const CSV_COLUMNS = [
  "id",
  "timestamp",
  "media_type",
  "permalink",
  "views",
  "likes",
  "replies",
  "reposts",
  "quotes",
  "shares",
  "engagement_rate_pct",
  "text",
] as const;

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export async function GET(request: NextRequest) {
  if (!(await requireApiSession())) return unauthorizedResponse();

  const account = await db.threadsAccount.findFirst({ where: { isActive: true } });
  if (!account) return NextResponse.json({ error: "No active account" }, { status: 404 });

  const sp = request.nextUrl.searchParams;
  const sortParam = sp.get("sort") ?? "";
  const sort: SortKey = (SORT_KEYS as readonly string[]).includes(sortParam)
    ? (sortParam as SortKey)
    : "date";
  const dir: "asc" | "desc" = sp.get("dir") === "asc" ? "asc" : "desc";
  const query = (sp.get("q") ?? "").trim();
  const mediaFilter = (sp.get("type") ?? "").trim();

  const [tz, resolved] = await Promise.all([
    getServerTimezone(),
    resolveRangeParams({
      range: sp.get("range") ?? undefined,
      from: sp.get("from") ?? undefined,
      to: sp.get("to") ?? undefined,
    }),
  ]);
  const { since, until } = getTimeRange(resolved, tz);

  const where: Prisma.PostWhereInput = {
    accountId: account.id,
    timestamp: { gte: since, lte: until },
    mediaType: { not: "REPOST_FACADE" },
    ...(query ? { text: { contains: query, mode: "insensitive" as const } } : {}),
    ...(mediaFilter && mediaFilter !== "REPOST_FACADE" ? { mediaType: mediaFilter } : {}),
  };

  const columnSort = sort === "date" ? "timestamp" : sort;
  const orderBy =
    sort === "engRate"
      ? { timestamp: "desc" as const }
      : ({ [columnSort]: dir } as Prisma.PostOrderByWithRelationInput);

  const posts = await db.post.findMany({ where, orderBy, take: EXPORT_LIMIT });

  const engRateOf = (p: (typeof posts)[number]) =>
    p.views > 0 ? (p.likes + p.replies + p.reposts + p.quotes) / p.views : 0;

  if (sort === "engRate") {
    posts.sort((a, b) =>
      dir === "asc" ? engRateOf(a) - engRateOf(b) : engRateOf(b) - engRateOf(a),
    );
  }

  const rows = posts.map((p) =>
    [
      p.id,
      p.timestamp.toISOString(),
      p.mediaType,
      p.permalink,
      p.views,
      p.likes,
      p.replies,
      p.reposts,
      p.quotes,
      p.shares,
      Math.round(engRateOf(p) * 10000) / 100,
      p.text,
    ]
      .map(csvCell)
      .join(","),
  );

  // Prepend a BOM so spreadsheets read the UTF-8 text (e.g. CJK) correctly.
  const csv = `﻿${CSV_COLUMNS.join(",")}\n${rows.join("\n")}\n`;
  const filename = `threads-posts-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
