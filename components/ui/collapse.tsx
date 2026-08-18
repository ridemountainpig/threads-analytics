"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Shared expand/collapse: conditional sections (inline forms, banners) grow
// and shrink instead of hard-mounting, so surrounding content glides rather
// than jumps. Children mount when opening (autoFocus still fires) and unmount
// once the exit transition has finished. Reduced motion snaps straight to the
// target state — the transition is disabled, not slowed.
const EXIT_MS = 220;

export function Collapse({
  open,
  children,
  className,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(open);
  const [expanded, setExpanded] = useState(open);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (exitTimer.current) {
      clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }
    if (open) {
      setMounted(true);
      // Two frames so the collapsed state is committed before the transition
      // target lands — otherwise the browser skips the animation entirely.
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setExpanded(true));
      });
      return () => cancelAnimationFrame(raf);
    }
    setExpanded(false);
    exitTimer.current = setTimeout(() => setMounted(false), EXIT_MS);
    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      data-slot="collapse"
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
        expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
