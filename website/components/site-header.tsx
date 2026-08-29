import Image from "next/image";
import Link from "next/link";
import { FaGithub } from "react-icons/fa6";
import { LanguageMenu } from "@/components/language-menu";
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
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href={`/${locale}#product`}>{copy.product}</a>
          <a href={`/${locale}#demo`}>{copy.demo}</a>
          <a href={`/${locale}#features`}>{copy.features}</a>
          <a href={`/${locale}#deploy`}>{copy.deploy}</a>
          <Link href={`/${locale}/token-guide`}>{copy.tokenGuide}</Link>
        </nav>

        <div className="header-actions">
          <LanguageMenu locale={locale} />
          <a className="header-github" href={siteConfig.github} target="_blank" rel="noreferrer">
            <FaGithub className="github-icon" aria-hidden="true" />
            <span>{copy.github}</span>
          </a>
        </div>
      </div>
    </header>
  );
}
