// The single registry every locale-aware surface derives from: metadata
// hreflang, the sitemap, Open Graph locales, structured data, the language
// menu, and the proxy's Accept-Language matching. Adding a language means
// extending this file, the dictionaries in i18n.ts, and the OG image set
// (`pnpm og:generate`) — nothing else.
//
// Kept free of dictionary imports so proxy.ts can use it without pulling
// the full copy bundle into the proxy.

export const locales = ["en", "zh-TW", "ja"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
  ja: "日本語",
};

/** BCP 47 → Open Graph locale codes (og:locale / og:locale:alternate). */
export const openGraphLocales: Record<Locale, string> = {
  en: "en_US",
  "zh-TW": "zh_TW",
  ja: "ja_JP",
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

/**
 * Picks the best supported locale for an Accept-Language header: first an
 * exact tag match, then a primary-subtag match (so "zh", "zh-HK", "zh-CN"
 * all land on "zh-TW"), walking ranges in the order the client sent them.
 */
export function matchLocale(acceptLanguage: string | null): Locale {
  const ranges = (acceptLanguage ?? "")
    .toLowerCase()
    .split(",")
    .map((range) => range.split(";")[0].trim())
    .filter(Boolean);

  for (const range of ranges) {
    const exact = locales.find((locale) => locale.toLowerCase() === range);
    if (exact) return exact;
    const primary = range.split("-")[0];
    const partial = locales.find((locale) => locale.toLowerCase().split("-")[0] === primary);
    if (partial) return partial;
  }

  return defaultLocale;
}
