import Image from "next/image";
import Link from "next/link";
import { ChartNoAxesColumn, Plug, Ticket } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { LanguageMenu } from "@/components/language-menu";
import { MobileMenu } from "@/components/mobile-menu";
import { NavMenu } from "@/components/nav-menu";
import type { Dictionary, Locale } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";

export function SiteHeader({ locale, copy }: { locale: Locale; copy: Dictionary["nav"] }) {
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
          <a href={`/${locale}#demo`}>{copy.demo}</a>
          {/* Analytics, MCP, and the giveaway are all product capabilities —
              one entry keeps them together and off the guide shelf. */}
          <NavMenu
            label={copy.features}
            items={[
              {
                href: `/${locale}/analytics`,
                label: copy.analytics,
                icon: <ChartNoAxesColumn strokeWidth={2} />,
                page: true,
              },
              {
                href: `/${locale}/mcp`,
                label: copy.mcp,
                icon: <Plug strokeWidth={2} />,
                page: true,
              },
              {
                href: `/${locale}/giveaway`,
                label: copy.giveaway,
                icon: <Ticket strokeWidth={2} />,
                page: true,
              },
            ]}
          />
          <a href={`/${locale}#deploy`}>{copy.deploy}</a>
          <Link href={`/${locale}/token-guide`}>{copy.tokenGuide}</Link>
        </nav>

        <div className="header-actions">
          <LanguageMenu locale={locale} />
          <a className="header-github" href={siteConfig.github} target="_blank" rel="noreferrer">
            <FaGithub className="github-icon" aria-hidden="true" />
            <span>{copy.github}</span>
          </a>
          <MobileMenu locale={locale} copy={copy} />
        </div>
      </div>
    </header>
  );
}
