import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ChartNoAxesColumn,
  Clock,
  Eye,
  KeyRound,
  Laptop,
  MousePointerClick,
  Plug,
  Rocket,
  Ticket,
  TrendingDown,
} from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { Railway, Vercel, Zeabur } from "@/components/deployment-logos";
import { LanguageMenu } from "@/components/language-menu";
import { MobileMenu } from "@/components/mobile-menu";
import { NavMenu } from "@/components/nav-menu";
import type { Dictionary, Locale } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";
import { getSiteNav, type SiteNavIcon } from "@/lib/site-nav";

const navIcons: Record<SiteNavIcon, ReactNode> = {
  demo: <MousePointerClick strokeWidth={2} />,
  analytics: <ChartNoAxesColumn strokeWidth={2} />,
  mcp: <Plug strokeWidth={2} />,
  giveaway: <Ticket strokeWidth={2} />,
  deploy: <Rocket strokeWidth={2} />,
  railway: <Railway />,
  zeabur: <Zeabur />,
  vercel: <Vercel />,
  desktop: <Laptop strokeWidth={2} />,
  token: <KeyRound strokeWidth={2} />,
  "threads-insights": <Eye strokeWidth={2} />,
  "best-time-to-post": <Clock strokeWidth={2} />,
  "reach-drop": <TrendingDown strokeWidth={2} />,
};

const brandIcons = new Set<SiteNavIcon>(["railway", "zeabur", "vercel"]);

export function SiteHeader({ locale, copy }: { locale: Locale; copy: Dictionary["nav"] }) {
  const groups = getSiteNav(locale);

  return (
    <header className="site-header">
      <div className="site-shell header-inner">
        <Link href={`/${locale}`} className="brand-link" aria-label="Threads Analytics home">
          <Image
            src="/media/threads-analytics-icon.png"
            alt=""
            width={28}
            height={28}
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
              }))}
            />
          ))}
        </nav>

        <div className="header-actions">
          <LanguageMenu locale={locale} />
          <a className="header-github" href={siteConfig.github} target="_blank" rel="noreferrer">
            <FaGithub className="github-icon" aria-hidden="true" />
            <span>{copy.github}</span>
          </a>
          <MobileMenu
            groups={groups.map((group) => ({
              id: group.id,
              label: group.label,
              items: group.items.map(({ href, label, page }) => ({ href, label, page })),
            }))}
          />
        </div>
      </div>
    </header>
  );
}
