import { NextResponse, type NextRequest } from "next/server";
import { isLocale, locales, matchLocale } from "./lib/locales";
import { isSharedPublicPath } from "./lib/public-routes";

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

  // Only the root and known shared links receive locale negotiation. Unknown
  // paths continue into the app and return a real 404 instead of first being
  // redirected to a localized 404 (which wastes crawl budget and log volume).
  if (url.pathname !== "/" && !isSharedPublicPath(url.pathname)) {
    return NextResponse.next();
  }

  const locale = matchLocale(request.headers.get("accept-language"));
  url.pathname = `/${locale}${url.pathname === "/" ? "" : url.pathname}`;
  const response = NextResponse.redirect(url);
  response.headers.set("vary", "Accept-Language");
  return response;
}

export const config = {
  // Everything except Next internals and files with an extension
  // (/_next/*, /og/*.png, /sitemap.xml, /robots.txt, /favicon.ico, …), and
  // the non-localized Railway health endpoint.
  matcher: "/((?!_next|healthz|.*\\..*).*)",
};
