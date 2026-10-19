"use client";

import { Fragment, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useDetailsDismiss } from "@/components/use-details-dismiss";

// Long enough to cross the gap between the trigger and the popover without
// the menu blinking shut, short enough that it never feels stuck open.
const CLOSE_DELAY = 140;

export type NavMenuItem = {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
  /** Multi-colour brand mark: sits on a plain chip instead of the accent tint. */
  brandIcon?: boolean;
  /** Route rather than an in-page anchor, so it prefetches through <Link>. */
  page?: boolean;
  /** Short tag after the label, such as "New". */
  badge?: string;
  /** Tinted row with a solid icon, for the item the menu leads with. */
  featured?: boolean;
  /** Label for a sub-section that starts at this item. */
  section?: string;
};

// One primary-nav group — same <details> popover as the language menu, but
// the trigger reads as a nav link.
export function NavMenu({ label, items }: { label: string; items: NavMenuItem[] }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  useDetailsDismiss(menuRef);
  const pathname = usePathname();
  const currentHref = items.find((item) => item.page && item.href === pathname)?.href;

  // Open on hover where hovering is real. Touch devices have no hover state
  // and would fire this on the tap that already toggles the menu, so they
  // keep the plain click behaviour.
  useEffect(() => {
    const details = menuRef.current;
    if (!details) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let closeTimer: ReturnType<typeof setTimeout> | undefined;

    // The popover is a DOM child of <details>, so moving onto it counts as
    // staying inside; only the gap between them fires mouseleave, and the
    // delay plus the CSS bridge cover that.
    const open = () => {
      clearTimeout(closeTimer);
      details.setAttribute("open", "");
    };

    const scheduleClose = () => {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => details.removeAttribute("open"), CLOSE_DELAY);
    };

    details.addEventListener("mouseenter", open);
    details.addEventListener("mouseleave", scheduleClose);

    return () => {
      clearTimeout(closeTimer);
      details.removeEventListener("mouseenter", open);
      details.removeEventListener("mouseleave", scheduleClose);
    };
  }, []);

  const close = (event: React.MouseEvent<HTMLElement>) => {
    event.currentTarget.closest("details")?.removeAttribute("open");
  };

  return (
    <details className="nav-menu" ref={menuRef} data-current={currentHref ? "" : undefined}>
      <summary>
        {label}
        <ChevronDown className="nav-menu-chevron" aria-hidden="true" strokeWidth={2} />
      </summary>
      <div className="nav-menu-popover">
        {items.map((item) => {
          const iconClass = item.featured
            ? "nav-menu-icon nav-menu-icon-featured"
            : item.brandIcon
              ? "nav-menu-icon nav-menu-icon-brand"
              : "nav-menu-icon";
          const content = (
            <>
              <span className={iconClass} aria-hidden="true">
                {item.icon}
              </span>
              <span className="nav-menu-text">
                <span className="nav-menu-label">
                  {item.label}
                  {item.badge ? <span className="menu-badge">{item.badge}</span> : null}
                </span>
                <span className="nav-menu-description">{item.description}</span>
              </span>
            </>
          );
          const current = item.href === currentHref ? "page" : undefined;
          const className = item.featured ? "nav-menu-featured" : undefined;

          return (
            <Fragment key={item.href}>
              {item.section ? <span className="nav-menu-section">{item.section}</span> : null}
              {item.page ? (
                <Link href={item.href} aria-current={current} className={className} onClick={close}>
                  {content}
                </Link>
              ) : (
                <a href={item.href} className={className} onClick={close}>
                  {content}
                </a>
              )}
            </Fragment>
          );
        })}
      </div>
    </details>
  );
}
