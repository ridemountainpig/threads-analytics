import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { db } from "./db";

const SESSION_COOKIE = "ta_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getHmacKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("TOKEN_ENCRYPTION_KEY is not set");
  return Buffer.from(raw);
}

const MAX_PASSWORD_LENGTH = 256;

export async function verifyPassword(input: string): Promise<boolean> {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  if (input.length > MAX_PASSWORD_LENGTH) return false;
  try {
    const key = getHmacKey();
    const a = createHmac("sha256", key).update(input).digest();
    const b = createHmac("sha256", key).update(expected).digest();
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function createSession(): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  await Promise.all([
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.session.create({
      data: { token, expiresAt: new Date(now.getTime() + SESSION_DURATION_MS) },
    }),
  ]);
  return token;
}

export async function getSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const session = await db.session.findUnique({ where: { token } });
  if (!session) return false;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { token } });
    return false;
  }
  return true;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch((err) => {
      console.error("[auth] failed to delete session from DB", err);
    });
  }
  store.delete(SESSION_COOKIE);
}
