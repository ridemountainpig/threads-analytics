import "server-only";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED_IPS = 500;

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

// Take the right-most X-Forwarded-For entry (written by our trusted proxy), not
// the left-most spoofable one — otherwise a client can rotate the header to get
// a fresh rate-limit bucket every request. Assumes a reverse proxy is in front.
export function getClientIp(headersList: Headers): string {
  const xff = headersList.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return headersList.get("x-real-ip")?.trim() || "unknown";
}

export function consumeLoginAttempt(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    if (loginAttempts.size >= MAX_TRACKED_IPS) {
      for (const [key, val] of loginAttempts) {
        if (now > val.resetAt) loginAttempts.delete(key);
      }
      // Still full: evict oldest first (Map preserves insertion order) so a
      // flood of distinct, unexpired IPs can't grow the map without bound.
      while (loginAttempts.size >= MAX_TRACKED_IPS) {
        const oldest = loginAttempts.keys().next().value;
        if (oldest === undefined) break;
        loginAttempts.delete(oldest);
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
