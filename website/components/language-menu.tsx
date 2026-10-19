"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Languages } from "lucide-react";
import { useDetailsDismiss } from "@/components/use-details-dismiss";
import { isLocale, localeNames, locales, type Locale } from "@/lib/i18n";

/** One glyph like the theme menu; the current language lives in its label. */
export function LanguageMenu({ locale, label }: { locale: Locale; label: string }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  useDetailsDismiss(menuRef);
  const pathname = usePathname() ?? `/${locale}`;
  const firstSegment = pathname.split("/")[1] ?? "";
  const pathAfterLocale = isLocale(firstSegment)
    ? pathname.slice(firstSegment.length + 1)
    : pathname;
  const triggerLabel = `${label}: ${localeNames[locale]}`;

  return (
    <details className="language-menu" ref={menuRef}>
      <summary aria-label={triggerLabel} title={triggerLabel}>
        <Languages className="language-icon" aria-hidden="true" strokeWidth={1.8} />
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
            <Check className="language-check" aria-hidden="true" strokeWidth={2.2} />
            {localeNames[item]}
          </Link>
        ))}
      </div>
    </details>
  );
}
