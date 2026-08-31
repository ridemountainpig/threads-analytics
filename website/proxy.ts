import { NextResponse, type NextRequest } from "next/server";
import { isLocale, locales, matchLocale } from "./lib/locales";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const [, firstSegment = "", ...rest] = url.pathname.split("/");

  // Already locale-prefixed: nothing to do.
  if (isLocale(firstSegment)) return NextResponse.next();

  // Wrong-cased locale prefix (/zh-tw/…): permanently redirect to the
  // canonical casing so links that guessed the case don't 404.
  const caseFixedLocale = locales.find(
    (locale) => locale.toLowerCase() === firstSegment.toLowerCase(),
  );
  if (caseFixedLocale) {
    url.pathname = ["", caseFixedLocale, ...rest].join("/");
    return NextResponse.redirect(url, 308);
  }

  // No locale prefix (the root, or a shared link like /token-guide):
  // send the visitor to their preferred language's version of the same
  // path. The redirect target depends on Accept-Language; Vary keeps
  // shared caches from serving one locale's redirect to another visitor.
  const locale = matchLocale(request.headers.get("accept-language"));
  url.pathname = `/${locale}${url.pathname === "/" ? "" : url.pathname}`;
  const response = NextResponse.redirect(url);
  response.headers.set("vary", "Accept-Language");
  return response;
}

export const config = {
  // Everything except Next internals and files with an extension
  // (/_next/*, /og/*.png, /sitemap.xml, /robots.txt, /favicon.ico, …).
  matcher: "/((?!_next|.*\\..*).*)",
};
