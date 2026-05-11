import "server-only";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(headersList: Headers): string {
  return headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export function consumeLoginAttempt(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    if (loginAttempts.size >= 500) {
      for (const [key, val] of loginAttempts) {
        if (now > val.resetAt) loginAttempts.delete(key);
      }
    }
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) return false;
  record.count++;
  return true;
}

export function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}
