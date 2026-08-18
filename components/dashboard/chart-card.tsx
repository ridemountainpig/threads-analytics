"use client";

import { useState, type ReactNode } from "react";
import { Maximize2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Extra classes for the outer Card (e.g. grid column spans). */
  className?: string;
  /** Extra classes for the in-card chart container. */
  contentClassName?: string;
  labels: { expand: string; close: string };
}

export default function ChartCard({
  title,
  subtitle,
  children,
  className,
  contentClassName,
  labels,
}: ChartCardProps) {
  const [open, setOpen] = useState(false);
  // Viewport-relative position of the card at the moment of expansion; the
  // dialog's zoom then grows from the card's direction (and shrinks back the
  // same way) instead of from the screen center, keeping the spatial link
  // between the card and its expanded view.
  const [zoomOrigin, setZoomOrigin] = useState<string | undefined>(undefined);

  function expandFrom(target: HTMLElement) {
    const card = target.closest("[data-slot=card]") ?? target;
    const rect = card.getBoundingClientRect();
    const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
    setZoomOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
    setOpen(true);
  }

  return (
    <Card className={className}>
      {/* The expand button is taller than the 11px title; kept out of the flow so
          it can't stretch the header and pad the title→content gap. */}
      <CardHeader className="relative">
        <div className="min-w-0 space-y-0.5 pr-8">
          <CardTitle className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
            {title}
          </CardTitle>
          {subtitle ? <div className="text-muted-foreground/80 text-xs">{subtitle}</div> : null}
        </div>
        <button
          type="button"
          onClick={(e) => expandFrom(e.currentTarget)}
          aria-label={labels.expand}
          title={labels.expand}
          className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 absolute -top-1 right-3 inline-flex size-7 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 outline-none focus-visible:ring-3 active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          closeLabel={labels.close}
          className="max-h-[90vh] overflow-y-auto"
          style={zoomOrigin ? { transformOrigin: zoomOrigin } : undefined}
        >
          <DialogHeader className="pr-8">
            <DialogTitle className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
              {title}
            </DialogTitle>
            {subtitle ? <div className="text-muted-foreground/80 text-xs">{subtitle}</div> : null}
          </DialogHeader>
          {/* Rendered wider than the card, giving dense time-series room to breathe. */}
          {open ? <div className="min-w-0">{children}</div> : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
