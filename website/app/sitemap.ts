import type { MetadataRoute } from "next";
import { defaultLocale, locales } from "@/lib/locales";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/deploy/railway-agent",
    "/deploy/zeabur-agent",
    "/deploy/vercel-agent",
    "/token-guide",
  ];

  // No lastModified: stamping every URL with the build date would tell
  // crawlers the whole site changed on every deploy, which teaches them to
  // ignore the field entirely.
  return routes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${siteConfig.url}/${locale}${route}`,
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((item) => [item, `${siteConfig.url}/${item}${route}`])),
          "x-default": `${siteConfig.url}/${defaultLocale}${route}`,
        },
      },
    })),
  );
}
