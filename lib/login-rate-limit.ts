import "server-only";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED_IPS = 500;

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

export function createIpRateLimiter(maxAttempts: number, windowMs: number) {
  const attempts = new Map<string, { count: number; resetAt: number }>();

  return {
    consume(ip: string): boolean {
      const now = Date.now();
      const record = attempts.get(ip);

      if (!record || now > record.resetAt) {
        if (attempts.size >= MAX_TRACKED_IPS) {
          for (const [key, val] of attempts) {
            if (now > val.resetAt) attempts.delete(key);
          }
          // Still full: evict oldest first (Map preserves insertion order) so a
          // flood of distinct, unexpired IPs can't grow the map without bound.
          while (attempts.size >= MAX_TRACKED_IPS) {
            const oldest = attempts.keys().next().value;
            if (oldest === undefined) break;
            attempts.delete(oldest);
          }
        }
        attempts.set(ip, { count: 1, resetAt: now + windowMs });
        return true;
      }

      if (record.count >= maxAttempts) return false;
      record.count++;
      return true;
    },
    clear(ip: string): void {
      attempts.delete(ip);
    },
  };
}

const loginLimiter = createIpRateLimiter(MAX_ATTEMPTS, WINDOW_MS);

export function consumeLoginAttempt(ip: string): boolean {
  return loginLimiter.consume(ip);
}

export function clearLoginAttempts(ip: string): void {
  loginLimiter.clear(ip);
}
