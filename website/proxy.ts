import { NextResponse, type NextRequest } from "next/server";

function preferredLocale(request: NextRequest) {
  const header = request.headers.get("accept-language")?.toLowerCase() ?? "";
  if (header.includes("zh")) return "zh-TW";
  if (header.includes("ja")) return "ja";
  return "en";
}

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}`;
  const response = NextResponse.redirect(url);
  // The redirect target depends on Accept-Language; keep shared caches
  // from serving one locale's redirect to another locale's visitors.
  response.headers.set("vary", "Accept-Language");
  return response;
}

export const config = {
  matcher: "/",
};
