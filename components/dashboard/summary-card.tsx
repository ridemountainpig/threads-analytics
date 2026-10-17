import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CONFIDENCE_OPACITY = { low: 0.35, medium: 0.65, high: 1 } as const;

export interface BestHourSlot {
  label: string;
  postCount: number;
  confidence: "low" | "medium" | "high";
  confidenceLabel: string;
}

interface SummaryCardProps {
  title: string;
  headline: string;
  detail: string;
  note: string;
  bestHours?: {
    title: string;
    sub: string;
    postsLabel: string;
    href: string;
    slots: BestHourSlot[];
  };
}

const cardTitle = "text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase";
// Shares the stat grid's four columns from xl up so the hours card sits exactly
// over the fourth stat card; below that a fixed column keeps the list readable.
const gridClass = "grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-4";
const headlineClass = "text-[15px] leading-snug font-semibold tracking-[-0.01em]";
const detailClass = "text-foreground/75 max-w-[62ch] text-sm leading-relaxed";
const noteClass = "text-muted-foreground mt-auto pt-2 text-[11px]";
const slotClass = "flex items-baseline justify-between gap-3 text-sm leading-5";

// Two sibling cards on one grid row: each owns its own height, so the prose and
// the list never have to be stretched to match each other.
export function SummaryCard({ title, headline, detail, note, bestHours }: SummaryCardProps) {
  const showHours = bestHours && bestHours.slots.length > 0;
  return (
    <div className={showHours ? gridClass : undefined}>
      <Card className={showHours ? "xl:col-span-3" : undefined}>
        <CardHeader>
          <CardTitle className={cardTitle}>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-1.5">
          <p className={headlineClass}>{headline}</p>
          {detail && <p className={detailClass}>{detail}</p>}
          <p className={noteClass}>{note}</p>
        </CardContent>
      </Card>

      {showHours && (
        <Card className="group/hours relative">
          <CardHeader>
            <CardTitle className={cardTitle}>{bestHours.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-2">
            <ul className="space-y-1.5">
              {bestHours.slots.map((slot) => (
                <li key={slot.label} className={slotClass}>
                  <span className="inline-flex items-center gap-2 font-medium tabular-nums">
                    <span
                      aria-hidden
                      className="bg-tint size-1.5 rounded-full"
                      style={{ opacity: CONFIDENCE_OPACITY[slot.confidence] }}
                    />
                    {slot.label}
                  </span>
                  <span className="text-muted-foreground truncate text-xs tabular-nums">
                    {slot.postCount} {bestHours.postsLabel} · {slot.confidenceLabel}
                  </span>
                </li>
              ))}
            </ul>
            <p className={noteClass}>{bestHours.sub}</p>
          </CardContent>
          {/* The whole card is the tap target; the chevron in the header says so. */}
          <Link
            href={bestHours.href}
            aria-label={bestHours.title}
            className="hover:bg-tint/6 active:bg-tint/10 absolute inset-0 rounded-xl transition-[background-color] duration-150 motion-reduce:transition-none"
          />
          <ChevronRight className="text-muted-foreground/60 group-hover/hours:text-tint pointer-events-none absolute top-4 right-4 size-3.5 transition-colors" />
        </Card>
      )}
    </div>
  );
}

const bar = "bg-muted inline-block rounded-sm align-middle";
// A typical summary runs three lines on wide screens and five on phones.
const detailLines = [
  { width: "w-full" },
  { width: "w-[94%]" },
  { width: "w-[86%] max-sm:w-full" },
  { width: "w-full", phoneOnly: true },
  { width: "w-3/5", phoneOnly: true },
];

export function SummaryCardSkeleton() {
  return (
    <div aria-hidden className={gridClass}>
      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle className={cardTitle}>
            <span className={cn(bar, "h-2.5 w-16")} />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-1.5">
          <p className={headlineClass}>
            <span className={cn(bar, "h-3.5 w-4/5")} />
          </p>
          <p className={detailClass}>
            {detailLines.map(({ width, phoneOnly }, i) => (
              <span key={i} className={cn("block", phoneOnly && "sm:hidden")}>
                <span className={cn(bar, "bg-muted/70 h-3", width)} />
              </span>
            ))}
          </p>
          <p className={noteClass}>
            <span className={cn(bar, "bg-muted/70 h-2.5 w-3/5")} />
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className={cardTitle}>
            <span className={cn(bar, "h-2.5 w-28")} />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-2">
          <ul className="space-y-1.5">
            {[0, 1, 2].map((i) => (
              <li key={i} className={slotClass}>
                <span>
                  <span className={cn(bar, "h-3 w-14")} />
                </span>
                <span className="text-xs">
                  <span className={cn(bar, "bg-muted/70 h-2.5 w-24")} />
                </span>
              </li>
            ))}
          </ul>
          <p className={noteClass}>
            <span className={cn(bar, "bg-muted/70 h-2.5 w-4/5")} />
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
