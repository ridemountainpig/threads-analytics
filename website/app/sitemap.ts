import type { MetadataRoute } from "next";
import { guideMeta, guideSlugs } from "@/lib/guides";
import { defaultLocale, locales } from "@/lib/locales";
import { selfHostMeta } from "@/lib/self-host";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const guideDates = guideSlugs.map((slug) => guideMeta[slug].modified);
  const routes: { path: string; lastModified?: string }[] = [
    { path: "" },
    { path: "/deploy/railway-agent" },
    { path: "/deploy/zeabur-agent" },
    { path: "/deploy/vercel-agent" },
    { path: "/deploy/self-host", lastModified: selfHostMeta.modified },
    { path: "/desktop" },
    { path: "/token-guide" },
    { path: "/mcp" },
    { path: "/giveaway" },
    { path: "/analytics" },
    { path: "/guides", lastModified: guideDates.toSorted().at(-1) },
    ...guideSlugs.map((slug) => ({
      path: `/guides/${slug}`,
      lastModified: guideMeta[slug].modified,
    })),
  ];

  // Only the guides and the self-host guide carry lastModified, from their
  // hand-kept dates. Stamping every URL with the build date would tell
  // crawlers the whole site changed on every deploy, which teaches them to
  // ignore the field entirely.
  return routes.flatMap(({ path: route, lastModified }) =>
    locales.map((locale) => ({
      url: `${siteConfig.url}/${locale}${route}`,
      ...(lastModified && { lastModified }),
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((item) => [item, `${siteConfig.url}/${item}${route}`])),
          "x-default": `${siteConfig.url}/${defaultLocale}${route}`,
        },
      },
    })),
  );
}
