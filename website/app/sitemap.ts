import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const languageAlternates = {
    en: `${siteConfig.url}/en`,
    "zh-TW": `${siteConfig.url}/zh-TW`,
    ja: `${siteConfig.url}/ja`,
    "x-default": `${siteConfig.url}/en`,
  };

  const lastModified = new Date();

  return locales.map((locale) => ({
    url: `${siteConfig.url}/${locale}`,
    lastModified,
    alternates: {
      languages: languageAlternates,
    },
  }));
}
