import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ChartNoAxesColumn,
  Clock,
  Eye,
  KeyRound,
  MousePointerClick,
  Plug,
  Rocket,
  Server,
  Ticket,
  TrendingDown,
} from "lucide-react";
import { FaApple, FaGithub } from "react-icons/fa6";
import { Railway, Vercel } from "@/components/deployment-logos";
import { LanguageMenu } from "@/components/language-menu";
import { MobileMenu } from "@/components/mobile-menu";
import { NavMenu } from "@/components/nav-menu";
import { ThemeMenu } from "@/components/theme-menu";
import type { Dictionary, Locale } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";
import { formatStars, getGithubStars } from "@/lib/github-stars";
import { getSiteNav, type SiteNavIcon } from "@/lib/site-nav";

const navIcons: Record<SiteNavIcon, ReactNode> = {
  demo: <MousePointerClick strokeWidth={2} />,
  analytics: <ChartNoAxesColumn strokeWidth={2} />,
  mcp: <Plug strokeWidth={2} />,
  giveaway: <Ticket strokeWidth={2} />,
  deploy: <Rocket strokeWidth={2} />,
  railway: <Railway />,
  vercel: <Vercel />,
  "self-host": <Server strokeWidth={2} />,
  desktop: <FaApple />,
  token: <KeyRound strokeWidth={2} />,
  "threads-insights": <Eye strokeWidth={2} />,
  "best-time-to-post": <Clock strokeWidth={2} />,
  "reach-drop": <TrendingDown strokeWidth={2} />,
};

const brandIcons = new Set<SiteNavIcon>(["railway", "vercel"]);

/**
 * `productBar`: the page pins its own product bar (the Mac page), so the
 * header scrolls away beneath it as on Apple's product pages and drops the
 * Mac app button that bar's Download replaces.
 */
export async function SiteHeader({
  locale,
  copy,
  productBar = false,
}: {
  locale: Locale;
  copy: Dictionary["nav"];
  productBar?: boolean;
}) {
  const groups = getSiteNav(locale);
  const stars = await getGithubStars();

  return (
    <header className={productBar ? "site-header site-header-scrolls" : "site-header"}>
      <div className="site-shell header-inner">
        <Link href={`/${locale}`} className="brand-link" aria-label="Threads Analytics home">
          <Image
            src="/media/threads-analytics-icon.png"
            alt=""
            width={24}
            height={24}
            className="brand-icon"
            priority
          />
          <span>Threads Analytics</span>
          {copy.brandTag ? <span className="brand-tag">{copy.brandTag}</span> : null}
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {groups.map((group) => (
            <NavMenu
              key={group.id}
              label={group.label}
              items={group.items.map((item) => ({
                href: item.href,
                label: item.label,
                description: item.description,
                icon: navIcons[item.icon],
                brandIcon: brandIcons.has(item.icon),
                page: item.page,
                badge: item.badge,
                featured: item.featured,
                section: item.section,
              }))}
            />
          ))}
        </nav>

        <div className="header-actions">
          <ThemeMenu copy={copy.theme} />
          <LanguageMenu locale={locale} label={copy.language} />
          <a
            className={stars === null ? "header-icon-button" : "header-icon-button header-github"}
            href={siteConfig.github}
            target="_blank"
            rel="noreferrer"
            aria-label={
              stars === null
                ? copy.github
                : `${copy.github}, ${copy.githubStars.replace("{count}", String(stars))}`
            }
          >
            <FaGithub aria-hidden="true" />
            {stars === null ? null : (
              <span className="header-github-stars" aria-hidden="true">
                ★ {formatStars(stars)}
              </span>
            )}
          </a>
          {productBar ? null : (
            <Link
              href={`/${locale}/desktop`}
              className="header-cta"
              aria-label={copy.desktop.label}
            >
              <FaApple className="header-cta-icon" aria-hidden="true" />
              <span className="header-cta-label">{copy.desktop.label}</span>
            </Link>
          )}
          <MobileMenu
            groups={groups.map((group) => ({
              id: group.id,
              label: group.label,
              items: group.items.map(({ href, label, page, badge, section }) => ({
                href,
                label,
                page,
                badge,
                section,
              })),
            }))}
          />
        </div>
      </div>
    </header>
  );
}
