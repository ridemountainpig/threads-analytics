import { getGuide, guideSlugs, type GuideSlug } from "@/lib/guides";
import { getDictionary, type Locale } from "@/lib/i18n";

// One map for the header dropdowns, the mobile menu and the footer columns,
// so a page added to one surface shows up on all three.

export type SiteNavIcon =
  | "demo"
  | "analytics"
  | "mcp"
  | "giveaway"
  | "deploy"
  | "railway"
  | "zeabur"
  | "vercel"
  | "token"
  | GuideSlug;

export type SiteNavItem = {
  href: string;
  label: string;
  /** Longer anchor text where the footer has room for it. */
  footerLabel: string;
  description: string;
  icon: SiteNavIcon;
  /** Route rather than an in-page anchor on the home page. */
  page: boolean;
};

export type SiteNavGroup = {
  id: "features" | "deploy" | "guides";
  label: string;
  items: SiteNavItem[];
};

export function getSiteNav(locale: Locale): SiteNavGroup[] {
  const { nav, footer } = getDictionary(locale);
  const home = `/${locale}`;

  const entry = (
    copy: { label: string; description: string },
    href: string,
    icon: SiteNavIcon,
    footerLabel: string = copy.label,
  ): SiteNavItem => ({
    href,
    label: copy.label,
    footerLabel,
    description: copy.description,
    icon,
    page: !href.includes("#"),
  });

  return [
    {
      id: "features",
      label: nav.features,
      items: [
        entry(nav.demo, `${home}#demo`, "demo"),
        entry(nav.analytics, `${home}/analytics`, "analytics"),
        entry(nav.mcp, `${home}/mcp`, "mcp"),
        entry(nav.giveaway, `${home}/giveaway`, "giveaway"),
      ],
    },
    {
      id: "deploy",
      label: nav.deploy,
      items: [
        entry(nav.deployOptions, `${home}#deploy`, "deploy"),
        entry(nav.railwayAgent, `${home}/deploy/railway-agent`, "railway"),
        entry(nav.zeaburAgent, `${home}/deploy/zeabur-agent`, "zeabur"),
        entry(nav.vercelAgent, `${home}/deploy/vercel-agent`, "vercel"),
      ],
    },
    {
      id: "guides",
      label: nav.guides,
      items: [
        entry(nav.tokenGuide, `${home}/token-guide`, "token", footer.tokenGuide),
        ...guideSlugs.map((slug) => {
          const guide = getGuide(slug, locale);
          return entry(
            { label: guide.menuTitle, description: guide.menuDescription },
            `${home}/guides/${slug}`,
            slug,
            guide.navTitle,
          );
        }),
      ],
    },
  ];
}
