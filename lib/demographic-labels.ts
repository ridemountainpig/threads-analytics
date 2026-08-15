import type { DemographicBreakdown } from "@/lib/followers";

/**
 * Renders a raw breakdown key for display: country keys are ISO 3166-1 codes,
 * gender keys are single letters the caller supplies translations for, and age
 * and city keys are already human-readable.
 *
 * Must only run on the server. Intl.DisplayNames resolves against whichever ICU
 * data the runtime ships, and Node's differs from the browser's — zh-TW "HK" is
 * "中國香港特別行政區" in Node and "香港" in Chrome. Calling this during client
 * render therefore produces a hydration mismatch, so labels are resolved once on
 * the server and passed to charts as plain strings.
 */
export function formatDemographicKey(
  key: string,
  breakdown: DemographicBreakdown,
  locale: string,
  genders?: Record<string, string>,
): string {
  if (breakdown === "country") {
    try {
      // "short" keeps Hong Kong from rendering as its full official name, which
      // would blow out the label column.
      return new Intl.DisplayNames([locale], { type: "region", style: "short" }).of(key) ?? key;
    } catch {
      return key;
    }
  }
  if (breakdown === "gender") return genders?.[key] ?? key;
  if (breakdown === "city") {
    // City keys arrive as "City, Region", which is often a doubled name —
    // "Taipei, Taipei", "Hong Kong, Hong Kong" — and the repeat is what gets
    // truncated away in narrow columns.
    const [city, region] = key.split(",").map((part) => part.trim());
    if (city && region && city === region) return city;
    return key;
  }
  return key;
}

/** Resolves every key of one breakdown up front, for handing to a chart. */
export function buildDemographicLabels(
  keys: string[],
  breakdown: DemographicBreakdown,
  locale: string,
  genders?: Record<string, string>,
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const key of keys) {
    labels[key] = formatDemographicKey(key, breakdown, locale, genders);
  }
  return labels;
}
