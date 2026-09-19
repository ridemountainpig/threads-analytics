"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useDetailsDismiss } from "@/components/use-details-dismiss";

// Long enough to cross the gap between the trigger and the popover without
// the menu blinking shut, short enough that it never feels stuck open.
const CLOSE_DELAY = 140;

export type NavMenuItem = {
  href: string;
  label: string;
  icon: ReactNode;
  /** Route rather than an in-page anchor, so it prefetches through <Link>. */
  page?: boolean;
};

// Groups the feature pages under one primary-nav entry — same <details>
// popover as the language menu, but the trigger reads as a nav link.
export function NavMenu({ label, items }: { label: string; items: NavMenuItem[] }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  useDetailsDismiss(menuRef);

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
    <details className="nav-menu" ref={menuRef}>
      <summary>
        {label}
        <ChevronDown className="nav-menu-chevron" aria-hidden="true" strokeWidth={2} />
      </summary>
      <div className="nav-menu-popover">
        {items.map((item) => {
          const content = (
            <>
              <span className="nav-menu-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </>
          );

          return item.page ? (
            <Link key={item.href} href={item.href} onClick={close}>
              {content}
            </Link>
          ) : (
            <a key={item.href} href={item.href} onClick={close}>
              {content}
            </a>
          );
        })}
      </div>
    </details>
  );
}
