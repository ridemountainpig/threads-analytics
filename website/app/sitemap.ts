import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/deploy/railway-agent", "/deploy/zeabur-agent", "/deploy/vercel-agent"];
  const lastModified = new Date();

  return routes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${siteConfig.url}/${locale}${route}`,
      lastModified,
      alternates: {
        languages: {
          en: `${siteConfig.url}/en${route}`,
          "zh-TW": `${siteConfig.url}/zh-TW${route}`,
          ja: `${siteConfig.url}/ja${route}`,
          "x-default": `${siteConfig.url}/en${route}`,
        },
      },
    })),
  );
}
