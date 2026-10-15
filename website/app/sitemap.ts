import type { MetadataRoute } from "next";
import { guideMeta, guideSlugs } from "@/lib/guides";
import { defaultLocale, locales } from "@/lib/locales";
import { staticPublicRoutes } from "@/lib/public-routes";
import { selfHostMeta } from "@/lib/self-host";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const guideDates = guideSlugs.map((slug) => guideMeta[slug].modified);
  const routes: { path: string; lastModified?: string }[] = [
    ...staticPublicRoutes.map((path) => ({
      path,
      ...(path === "/deploy/self-host" && { lastModified: selfHostMeta.modified }),
      ...(path === "/guides" && { lastModified: guideDates.toSorted().at(-1) }),
    })),
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
