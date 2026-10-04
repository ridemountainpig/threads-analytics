import { writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { textContainsInsensitive } from "@/lib/database/text-search";
import { Prisma } from "@/lib/generated/prisma";
import { requireApiSession, unauthorizedResponse } from "@/lib/api-auth";
import { getTimeRange } from "@/lib/time-range";
import { resolveRangeParams } from "@/lib/time-range-server";
import { getServerTimezone } from "@/lib/server-timezone";
import { isDesktopApp } from "@/lib/runtime-target";
import { csvExportFilename } from "@/lib/csv-export";

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
  "thread_parts",
  "part2_retention_pct",
  "text",
] as const;

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

async function buildCsv(sp: URLSearchParams): Promise<string | null> {
  const account = await db.threadsAccount.findFirst({ where: { isActive: true } });
  if (!account) return null;

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
    ...(query ? { text: textContainsInsensitive(query) } : {}),
    ...(mediaFilter && mediaFilter !== "REPOST_FACADE" ? { mediaType: mediaFilter } : {}),
  };

  const columnSort = sort === "date" ? "timestamp" : sort;
  const orderBy =
    sort === "engRate"
      ? { timestamp: "desc" as const }
      : ({ [columnSort]: dir } as Prisma.PostOrderByWithRelationInput);

  const posts = await db.post.findMany({ where, orderBy, take: EXPORT_LIMIT });

  // Thread parts per root: how many parts the thread has (root included) and
  // how much of the root's reach carried into part 2.
  const threadParts = posts.length
    ? await db.threadReply.findMany({
        where: { rootPostId: { in: posts.map((p) => p.id) } },
        orderBy: [{ timestamp: "asc" }],
        select: { rootPostId: true, position: true, views: true },
      })
    : [];
  const partCount = new Map<string, number>();
  const part2Views = new Map<string, number>();
  for (const part of threadParts) {
    partCount.set(part.rootPostId, (partCount.get(part.rootPostId) ?? 0) + 1);
    if (part.position === 2 && !part2Views.has(part.rootPostId)) {
      part2Views.set(part.rootPostId, part.views);
    }
  }
  const retentionOf = (p: (typeof posts)[number]) => {
    const views = part2Views.get(p.id);
    if (views === undefined || p.views <= 0) return "";
    return Math.round((views / p.views) * 1000) / 10;
  };

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
      (partCount.get(p.id) ?? 0) + 1,
      retentionOf(p),
      p.text,
    ]
      .map(csvCell)
      .join(","),
  );

  // Prepend a BOM so spreadsheets read the UTF-8 text (e.g. CJK) correctly.
  return `﻿${CSV_COLUMNS.join(",")}\n${rows.join("\n")}\n`;
}

export async function GET(request: NextRequest) {
  if (!(await requireApiSession())) return unauthorizedResponse();

  const csv = await buildCsv(request.nextUrl.searchParams);
  if (csv === null) return NextResponse.json({ error: "No active account" }, { status: 404 });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvExportFilename()}"`,
      "Cache-Control": "no-store",
    },
  });
}

// The custom header forces a CORS preflight, so browser pages cannot trigger this write.
export async function POST(request: NextRequest) {
  if (!isDesktopApp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.headers.get("x-desktop-export") !== "1") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const requested =
    body && typeof body === "object" && "path" in body && typeof body.path === "string"
      ? body.path
      : "";
  if (!path.isAbsolute(requested)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const target = path.extname(requested).toLowerCase() === ".csv" ? requested : `${requested}.csv`;

  const csv = await buildCsv(request.nextUrl.searchParams);
  if (csv === null) return NextResponse.json({ error: "No active account" }, { status: 404 });

  try {
    await writeFile(target, csv, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ path: target });
}
