"use client";

import { useRef } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useDetailsDismiss } from "@/components/use-details-dismiss";
import type { Dictionary, Locale } from "@/lib/i18n";

// Compact nav for the band where .desktop-nav is hidden — same <details>
// popover pattern as LanguageMenu, so it needs no extra state and works
// without JS. The desktop feature menu flattens into an indented group here.
export function MobileMenu({ locale, copy }: { locale: Locale; copy: Dictionary["nav"] }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  useDetailsDismiss(menuRef);

  const close = (event: React.MouseEvent<HTMLElement>) => {
    event.currentTarget.closest("details")?.removeAttribute("open");
  };

  return (
    <details className="mobile-menu" ref={menuRef}>
      <summary aria-label="Open navigation">
        <Menu className="mobile-menu-icon" aria-hidden="true" strokeWidth={1.9} />
      </summary>
      <nav className="mobile-menu-popover" aria-label="Primary navigation">
        <a href={`/${locale}#demo`} onClick={close}>
          {copy.demo}
        </a>
        <span className="mobile-menu-label">{copy.features}</span>
        <Link className="mobile-menu-sub" href={`/${locale}/analytics`} onClick={close}>
          {copy.analytics}
        </Link>
        <Link className="mobile-menu-sub" href={`/${locale}/mcp`} onClick={close}>
          {copy.mcp}
        </Link>
        <Link className="mobile-menu-sub" href={`/${locale}/giveaway`} onClick={close}>
          {copy.giveaway}
        </Link>
        <a href={`/${locale}#deploy`} onClick={close}>
          {copy.deploy}
        </a>
        <Link href={`/${locale}/token-guide`} onClick={close}>
          {copy.tokenGuide}
        </Link>
      </nav>
    </details>
  );
}
