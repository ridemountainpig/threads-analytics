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

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
              {title}
            </CardTitle>
            {subtitle ? <div className="text-muted-foreground text-xs">{subtitle}</div> : null}
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={labels.expand}
            title={labels.expand}
            className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 -mt-1 -mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-3"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeLabel={labels.close} className="max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-muted-foreground text-sm tracking-wider uppercase">
              {title}
            </DialogTitle>
            {subtitle ? <div className="text-muted-foreground text-xs">{subtitle}</div> : null}
          </DialogHeader>
          {/* Rendered wider than the card, giving dense time-series room to breathe. */}
          {open ? <div className="min-w-0">{children}</div> : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
