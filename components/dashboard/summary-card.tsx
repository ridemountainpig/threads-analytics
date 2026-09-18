import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

// Two sibling cards on one grid row: each owns its own height, so the prose and
// the list never have to be stretched to match each other.
export function SummaryCard({ title, headline, detail, note, bestHours }: SummaryCardProps) {
  const showHours = bestHours && bestHours.slots.length > 0;
  return (
    // Shares the stat grid's four columns from xl up so the hours card sits exactly
    // over the fourth stat card; below that a fixed column keeps the list readable.
    <div
      className={
        showHours ? "grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-4" : undefined
      }
    >
      <Card className={showHours ? "xl:col-span-3" : undefined}>
        <CardHeader>
          <CardTitle className={cardTitle}>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-1.5">
          <p className="text-[15px] leading-snug font-semibold tracking-[-0.01em]">{headline}</p>
          {detail && (
            <p className="text-foreground/75 max-w-[62ch] text-sm leading-relaxed">{detail}</p>
          )}
          <p className="text-muted-foreground/80 mt-auto pt-2 text-[11px]">{note}</p>
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
                <li
                  key={slot.label}
                  className="flex items-baseline justify-between gap-3 text-sm leading-5"
                >
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
            <p className="text-muted-foreground/80 mt-auto pt-2 text-[11px]">{bestHours.sub}</p>
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
