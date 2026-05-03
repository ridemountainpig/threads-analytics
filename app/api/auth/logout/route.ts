import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";

export async function POST() {
  if (!(await getSession())) {
    return NextResponse.json({ success: true });
  }
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
