"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useDetailsDismiss } from "@/components/use-details-dismiss";

// Compact nav for the band where .desktop-nav is hidden — same <details>
// popover pattern as LanguageMenu, so it needs no extra state and works
// without JS. Each desktop dropdown becomes a labelled group here.
export type MobileMenuGroup = {
  id: string;
  label: string;
  items: { href: string; label: string; page: boolean }[];
};

// Groups come in as plain props so this client component does not pull the
// dictionaries or the guide copy bundle into the browser.
export function MobileMenu({ groups }: { groups: MobileMenuGroup[] }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  useDetailsDismiss(menuRef);
  const pathname = usePathname();

  const close = (event: React.MouseEvent<HTMLElement>) => {
    event.currentTarget.closest("details")?.removeAttribute("open");
  };

  return (
    <details className="mobile-menu" ref={menuRef}>
      <summary aria-label="Open navigation">
        <Menu className="mobile-menu-icon" aria-hidden="true" strokeWidth={1.9} />
      </summary>
      <nav className="mobile-menu-popover" aria-label="Primary navigation">
        {groups.map((group) => (
          <div key={group.id} className="mobile-menu-group">
            <span className="mobile-menu-label">{group.label}</span>
            {group.items.map((item) =>
              item.page ? (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item.href === pathname ? "page" : undefined}
                  onClick={close}
                >
                  {item.label}
                </Link>
              ) : (
                <a key={item.href} href={item.href} onClick={close}>
                  {item.label}
                </a>
              ),
            )}
          </div>
        ))}
      </nav>
    </details>
  );
}
