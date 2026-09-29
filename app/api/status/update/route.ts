import { NextResponse } from "next/server";
import { requireApiSession, unauthorizedResponse } from "@/lib/api-auth";
import { getResolvedUpdateStatus } from "@/lib/update-check";
import type { UpdateStatusPayload } from "@/lib/update-status";

export async function GET() {
  if (!(await requireApiSession())) return unauthorizedResponse();

  const status = await getResolvedUpdateStatus();
  return NextResponse.json(status satisfies UpdateStatusPayload, {
    headers: { "Cache-Control": "no-store" },
  });
}
