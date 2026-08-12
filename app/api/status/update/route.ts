import { NextResponse } from "next/server";
import { requireApiSession, unauthorizedResponse } from "@/lib/api-auth";
import { getImageUpdateStatus } from "@/lib/image-update";

export async function GET() {
  if (!(await requireApiSession())) return unauthorizedResponse();

  return NextResponse.json(await getImageUpdateStatus());
}
