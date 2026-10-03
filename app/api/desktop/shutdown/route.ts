import { NextResponse } from "next/server";
import { isDesktopApp } from "@/lib/runtime-target";

export const dynamic = "force-dynamic";

// Lets a newer app launch take over the fixed sidecar port from a stale
// instance (the webview URL is pinned to one port in app.json, so without this
// an updated app would silently keep showing the old server). The custom
// header forces a CORS preflight, so a web page in a browser can never trigger
// it; the desktop proxy rejects non-loopback Host headers on every route.
export async function POST(request: Request) {
  if (!isDesktopApp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.headers.get("x-desktop-shutdown") !== "1") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  console.info("[desktop] shutdown requested by a newer app launch; exiting");
  // Let the response flush before the process dies.
  setTimeout(() => process.exit(0), 150);
  return NextResponse.json({ ok: true });
}
