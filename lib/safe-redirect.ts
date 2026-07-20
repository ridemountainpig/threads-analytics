export const DEFAULT_REDIRECT = "/dashboard/overview";

// Only allow same-origin, absolute-path redirects. Reject anything a browser
// might normalize into an off-site URL: "//host" and "/\host" (protocol
// relative) and any control/whitespace char (tab, newline, CR, etc.) that the
// WHATWG URL parser strips — e.g. "/\t/evil.com" collapses to "//evil.com".
export function sanitizeRedirectPath(
  input: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (typeof input !== "string") return fallback;
  // Reject control chars (<= 0x1f, 0x7f) and backslashes — they never appear in
  // a trusted internal path and are the vector for the normalization bypass.
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f || code === 0x5c /* \ */) return fallback;
  }
  if (!input.startsWith("/") || input.startsWith("//")) return fallback;
  return input;
}
