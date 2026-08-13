import type { Metadata } from "next";
import { locales, type Locale } from "./i18n";
import { siteConfig } from "./site";

const openGraphLocales: Record<Locale, string> = {
  en: "en_US",
  "zh-TW": "zh_TW",
  ja: "ja_JP",
};

// Shared per-page metadata: canonical + hreflang derived from `locales`, plus
// Open Graph and Twitter cards pointing at the pre-rendered images in
// public/og (see scripts/og/generate-og-images.tsx). Every localized page
// should build its metadata through this so adding a locale or changing the
// OG setup happens in one place.
export function localizedPageMetadata({
  locale,
  path,
  title,
  description,
  ogImageSet,
}: {
  locale: Locale;
  /** Route path after the locale segment: "" for home, "/deploy/railway-agent", … */
  path: string;
  title: string;
  description: string;
  /** Basename prefix of a pre-rendered OG image set, e.g. "railway-agent" for
   * /og/railway-agent-en.png. Omit for the home set (/og/en.png). */
  ogImageSet?: string;
}): Metadata {
  const ogImage = {
    url: ogImageSet ? `/og/${ogImageSet}-${locale}.png` : `/og/${locale}.png`,
    width: 1200,
    height: 630,
    alt: siteConfig.name,
    type: "image/png",
  };

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: {
        ...Object.fromEntries(locales.map((item) => [item, `/${item}${path}`])),
        "x-default": `/en${path}`,
      },
    },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: openGraphLocales[locale],
      url: `/${locale}${path}`,
      title,
      description,
      images: [ogImage],
    },
    // Declared per page: Next.js merges metadata per top-level key, so without
    // this a subpage would inherit the layout's Twitter card (home copy).
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
