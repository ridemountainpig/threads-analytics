"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Collapse } from "@/components/ui/collapse";
import { cn } from "@/lib/utils";

export default function CollapsibleCard({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <Card className="gap-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-4 text-left transition-opacity duration-150 active:opacity-60 motion-reduce:transition-none"
      >
        <span className="min-w-0 flex-1 space-y-1">
          <span className="text-muted-foreground block text-[11px] font-semibold tracking-[0.08em] uppercase">
            {title}
          </span>
          <span className="text-muted-foreground block text-xs">{subtitle}</span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>
      <div id={contentId}>
        <Collapse open={open}>
          <div className="px-4 pt-4">{children}</div>
        </Collapse>
      </div>
    </Card>
  );
}
