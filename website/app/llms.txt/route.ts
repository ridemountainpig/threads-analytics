import { getGuide, guideHub, guideSlugs } from "@/lib/guides";
import { getDictionary } from "@/lib/i18n";
import { defaultLocale, localeNames, locales } from "@/lib/locales";
import { staticPublicRoutes } from "@/lib/public-routes";
import { selfHost } from "@/lib/self-host";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

type PageCopy = { title: string; description: string };

export function GET() {
  const locale = defaultLocale;
  const copy = getDictionary(locale);

  // Keyed by every static route so a new page fails type-checking until it is listed here.
  const pages: Record<(typeof staticPublicRoutes)[number], PageCopy> = {
    "": copy.metadata,
    "/analytics": copy.analyticsGuide.metadata,
    "/desktop": copy.desktopGuide.metadata,
    "/mcp": copy.mcpGuide.metadata,
    "/giveaway": copy.giveawayGuide.metadata,
    "/guides": guideHub[locale].metadata,
    "/token-guide": copy.tokenGuide.metadata,
    "/deploy/self-host": selfHost[locale].metadata,
    "/deploy/railway-agent": copy.railwayAgentDeploy.metadata,
    "/deploy/zeabur-agent": copy.zeaburAgentDeploy.metadata,
    "/deploy/vercel-agent": copy.vercelAgentDeploy.metadata,
  };

  const link = (path: string, { title, description }: PageCopy) =>
    `- [${title}](${siteConfig.url}/${locale}${path}): ${description}`;
  const section = (heading: string, paths: (keyof typeof pages)[]) => [
    `## ${heading}`,
    "",
    ...paths.map((path) => link(path, pages[path])),
    "",
  ];

  const body = [
    `# ${siteConfig.name}`,
    "",
    `> ${copy.metadata.description}`,
    "",
    `Source code (AGPL-3.0): ${siteConfig.github}`,
    "",
    ...section("Product", ["", "/analytics", "/desktop", "/mcp", "/giveaway"]),
    "## Guides",
    "",
    link("/guides", pages["/guides"]),
    ...guideSlugs.map((slug) => link(`/guides/${slug}`, getGuide(slug, locale).metadata)),
    "",
    ...section("Setup", [
      "/token-guide",
      "/deploy/self-host",
      "/deploy/railway-agent",
      "/deploy/zeabur-agent",
      "/deploy/vercel-agent",
    ]),
    "## Other languages",
    "",
    ...locales
      .filter((item) => item !== locale)
      .map((item) => `- [${localeNames[item]}](${siteConfig.url}/${item})`),
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
