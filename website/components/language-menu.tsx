"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, Languages } from "lucide-react";
import { isLocale, localeNames, locales, type Locale } from "@/lib/i18n";

export function LanguageMenu({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? `/${locale}`;
  const firstSegment = pathname.split("/")[1] ?? "";
  const pathAfterLocale = isLocale(firstSegment)
    ? pathname.slice(firstSegment.length + 1)
    : pathname;

  return (
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
            href={`/${item}${pathAfterLocale}`}
            hrefLang={item}
            aria-current={item === locale ? "page" : undefined}
            onClick={(event) => {
              event.currentTarget.closest("details")?.removeAttribute("open");
            }}
          >
            {localeNames[item]}
            {item === locale ? (
              <Check className="language-current" aria-hidden="true" strokeWidth={2.2} />
            ) : null}
          </Link>
        ))}
      </div>
    </details>
  );
}
