/**
 * Locale-independent routes that are available in every supported language.
 *
 * Keep this module data-only: it is imported by Proxy, which should not pull
 * page dictionaries or other render-time dependencies into its bundle.
 */
export const staticPublicRoutes = [
  "",
  "/deploy/railway-agent",
  "/deploy/zeabur-agent",
  "/deploy/vercel-agent",
  "/deploy/self-host",
  "/desktop",
  "/token-guide",
  "/mcp",
  "/giveaway",
  "/analytics",
  "/guides",
] as const;

function withoutTrailingSlash(pathname: string) {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/** Whether an unprefixed public URL should receive locale negotiation. */
export function isSharedPublicPath(pathname: string) {
  const normalized = withoutTrailingSlash(pathname);

  if (staticPublicRoutes.some((path) => path !== "" && path === normalized)) return true;

  // Guide slugs are validated by the guide page. Restrict this to one segment
  // so arbitrary paths do not get turned into localized redirect chains.
  return /^\/guides\/[^/]+$/.test(normalized);
}
