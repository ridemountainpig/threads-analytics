import { NextResponse } from "next/server";
import { requireApiSession, unauthorizedResponse } from "@/lib/api-auth";
import {
  getImageUpdateStatus,
  getResolvedImageVersionLink,
  type ImageUpdateStatusPayload,
} from "@/lib/image-update";

export async function GET() {
  if (!(await requireApiSession())) return unauthorizedResponse();

  const [status, versionLink] = await Promise.all([
    getImageUpdateStatus(),
    getResolvedImageVersionLink(),
  ]);
  return NextResponse.json({ ...status, versionLink } satisfies ImageUpdateStatusPayload);
}
