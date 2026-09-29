import { readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { isDesktopApp } from "@/lib/runtime-target";

export const dynamic = "force-dynamic";

// The desktop sidecar chdirs into the staged server directory before booting
// Next, so the standalone build's id is always at ./.next/BUILD_ID. `next dev`
// has no BUILD_ID; "dev" keeps two dev sidecars from shutting each other down.
function buildId(): string {
  try {
    return readFileSync(path.join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim();
  } catch {
    return "dev";
  }
}

// Identifies this desktop sidecar to the next app launch, which reuses the
// port only when the running server is the same build (see start-server.mjs).
export function GET() {
  if (!isDesktopApp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ buildId: buildId() }, { headers: { "Cache-Control": "no-store" } });
}
