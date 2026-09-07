"use client";

import { useRef } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useDetailsDismiss } from "@/components/use-details-dismiss";
import type { Dictionary, Locale } from "@/lib/i18n";

// Compact nav for the ≤780px band where .desktop-nav is hidden — same
// <details> popover pattern as LanguageMenu, so it needs no extra state
// and works without JS.
export function MobileMenu({ locale, copy }: { locale: Locale; copy: Dictionary["nav"] }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  useDetailsDismiss(menuRef);

  const close = (event: React.MouseEvent<HTMLElement>) => {
    event.currentTarget.closest("details")?.removeAttribute("open");
  };

  const items: { href: string; label: string; page?: boolean }[] = [
    { href: `/${locale}#product`, label: copy.product },
    { href: `/${locale}#demo`, label: copy.demo },
    { href: `/${locale}#features`, label: copy.features },
    { href: `/${locale}#deploy`, label: copy.deploy },
    { href: `/${locale}/token-guide`, label: copy.tokenGuide, page: true },
  ];

  return (
    <details className="mobile-menu" ref={menuRef}>
      <summary aria-label="Open navigation">
        <Menu className="mobile-menu-icon" aria-hidden="true" strokeWidth={1.9} />
      </summary>
      <nav className="mobile-menu-popover" aria-label="Primary navigation">
        {items.map((item) =>
          item.page ? (
            <Link key={item.href} href={item.href} onClick={close}>
              {item.label}
            </Link>
          ) : (
            <a key={item.href} href={item.href} onClick={close}>
              {item.label}
            </a>
          ),
        )}
      </nav>
    </details>
  );
}
