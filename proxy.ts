import { NextRequest, NextResponse } from "next/server";
import { isDesktopApp } from "@/lib/runtime-target";

// /api/oauth and /api/mcp authenticate their own callers (OAuth flow / bearer tokens).
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/cron/sync", "/api/oauth", "/api/mcp"];

// The desktop sidecar only serves loopback clients. Rejecting any other Host
// header blocks DNS-rebinding pages, whose requests arrive same-origin (so
// CORS never applies) but carry the attacker's hostname.
function isLoopbackHost(hostHeader: string | null): boolean {
  if (!hostHeader) return false;
  const hostname = hostHeader.replace(/:\d+$/, "").toLowerCase();
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "[::1]";
}

export default function proxy(request: NextRequest) {
  if (isDesktopApp) {
    if (!isLoopbackHost(request.headers.get("host"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isPublic) return NextResponse.next();

  const isDashboard = pathname.startsWith("/dashboard");
  const isApi = pathname.startsWith("/api");

  if (!isDashboard && !isApi) return NextResponse.next();

  const sessionToken = request.cookies.get("ta_session")?.value;
  if (!sessionToken) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Match every route, not just /dashboard and /api: Server Actions are POSTs to
// whatever page hosts them (/, /login, /oauth/authorize), and the desktop Host
// check must cover those too. The web branch passes non-dashboard/api paths
// straight through, so widening the matcher does not change web auth.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
