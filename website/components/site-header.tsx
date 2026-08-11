import Image from "next/image";
import Link from "next/link";
import { Check, ChevronDown, Languages } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { localeNames, locales, type Dictionary, type Locale } from "@/lib/i18n";
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
          <a href="#product">{copy.product}</a>
          <a href="#demo">{copy.demo}</a>
          <a href="#features">{copy.features}</a>
          <a href="#deploy">{copy.deploy}</a>
        </nav>

        <div className="header-actions">
          <details className="language-menu">
            <summary aria-label="Change language">
              <Languages className="language-icon" aria-hidden="true" strokeWidth={1.9} />
              <span className="language-label">{localeNames[locale]}</span>
              <ChevronDown className="language-chevron" aria-hidden="true" strokeWidth={2} />
            </summary>
            <div className="language-popover">
              {locales.map((item) => (
                <Link
                  key={item}
                  href={`/${item}`}
                  hrefLang={item}
                  aria-current={item === locale ? "page" : undefined}
                >
                  {localeNames[item]}
                  {item === locale ? (
                    <Check className="language-current" aria-hidden="true" strokeWidth={2.2} />
                  ) : null}
                </Link>
              ))}
            </div>
          </details>
          <a className="header-github" href={siteConfig.github} target="_blank" rel="noreferrer">
            <FaGithub className="github-icon" aria-hidden="true" />
            <span>{copy.github}</span>
          </a>
        </div>
      </div>
    </header>
  );
}
