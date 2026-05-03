import "server-only";

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function requireApiSession() {
  return getSession();
}
