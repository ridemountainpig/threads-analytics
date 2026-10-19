import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";

type StatCardSize = "default" | "sm";

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  className?: string;
  delta?: number | null;
  deltaLabel?: string;
  /** Per-period values across the selected range; drawn as a sparkline when there are at least two. */
  trend?: number[];
  /** "sm" is the quieter tile for secondary breakdowns: smaller value, tighter padding, no sparkline. */
  size?: StatCardSize;
}

// Shared with StatCardSkeleton so loading tiles keep the real tiles' height.
const sizes = {
  default: { card: "", header: "px-4 pt-4 pb-1", content: "px-4 pb-4", value: "text-2xl" },
  sm: { card: "gap-1.5", header: "", content: "", value: "text-lg" },
} satisfies Record<StatCardSize, Record<string, string>>;

const titleClass = "text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase";
const valueRowClass = "flex flex-wrap items-end justify-between gap-x-4 gap-y-2";
const valueClass = "shrink-0 font-semibold tracking-[-0.01em] tabular-nums";
const trendClass = "min-w-0 basis-full sm:mb-1 sm:max-w-40 sm:flex-1 sm:basis-0";
const deltaRowClass = "mt-1 flex items-center gap-1.5 text-xs leading-4";
const subClass = "text-muted-foreground mt-0.5 text-xs";

export function StatCard({
  title,
  value,
  sub,
  className,
  delta,
  deltaLabel,
  trend,
  size = "default",
}: StatCardProps) {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;
  const layout = sizes[size];
  return (
    <Card className={cn(layout.card, className)}>
      <CardHeader className={layout.header}>
        <CardTitle className={titleClass}>{title}</CardTitle>
      </CardHeader>
      <CardContent className={layout.content}>
        {/* Phones stack the line under the number; a two-column grid there
            leaves too little width beside it for the shape to read. */}
        <div className={valueRowClass}>
          <p className={cn(valueClass, layout.value)}>{displayValue}</p>
          {size === "default" && trend && trend.length > 1 && (
            <div className={trendClass}>
              <Sparkline values={trend} />
            </div>
          )}
        </div>
        {delta != null && (
          <p className={deltaRowClass}>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium tabular-nums",
                delta > 0
                  ? "bg-green-600/10 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                  : delta < 0
                    ? "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {delta !== 0 && (
                <>
                  <svg
                    aria-hidden
                    width="7"
                    height="7"
                    viewBox="0 0 8 8"
                    className={cn("shrink-0", delta < 0 && "rotate-180")}
                  >
                    <path d="M4 0.5 L7.5 6.5 L0.5 6.5 Z" fill="currentColor" />
                  </svg>
                  <span className="sr-only">{delta > 0 ? "+" : "−"}</span>
                </>
              )}
              {Math.abs(delta)}%
            </span>
            {deltaLabel ? <span className="text-muted-foreground">{deltaLabel}</span> : null}
          </p>
        )}
        {sub && <p className={subClass}>{sub}</p>}
      </CardContent>
    </Card>
  );
}

const bar = "bg-muted inline-block rounded-sm align-middle";

// Same shell and line boxes as StatCard, so swapping in the real tile moves nothing.
export function StatCardSkeleton({
  size = "default",
  trend = false,
  delta = false,
  sub = false,
  className,
}: {
  size?: StatCardSize;
  trend?: boolean;
  delta?: boolean;
  sub?: boolean;
  className?: string;
}) {
  const layout = sizes[size];
  return (
    <Card aria-hidden className={cn(layout.card, className)}>
      <CardHeader className={layout.header}>
        <CardTitle className={titleClass}>
          <span className={cn(bar, "h-2.5 w-20")} />
        </CardTitle>
      </CardHeader>
      <CardContent className={layout.content}>
        <div className={valueRowClass}>
          <p className={cn(valueClass, layout.value)}>
            <span className={cn(bar, "h-[0.75em] w-20 rounded-md")} />
          </p>
          {size === "default" && trend && (
            <div className={trendClass}>
              <div className="bg-muted/70 h-7 rounded-md" />
            </div>
          )}
        </div>
        {delta && (
          <p className={deltaRowClass}>
            <span className="bg-muted h-5 w-12 rounded-full" />
            <span className="bg-muted/70 h-3 w-16 rounded-sm" />
          </p>
        )}
        {sub && (
          <p className={subClass}>
            <span className={cn(bar, "bg-muted/70 h-3 w-24")} />
          </p>
        )}
      </CardContent>
    </Card>
  );
}
