import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";
import { clearLoginAttempts, consumeLoginAttempt, getClientIp } from "@/lib/login-rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  if (!consumeLoginAttempt(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const password = body?.password as string | undefined;

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const valid = await verifyPassword(password);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  clearLoginAttempts(ip);
  const token = await createSession();
  await setSessionCookie(token);
  return NextResponse.json({ success: true });
}
