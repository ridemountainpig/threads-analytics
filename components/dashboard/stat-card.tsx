import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  className?: string;
  delta?: number | null;
  deltaLabel?: string;
}

export function StatCard({ title, value, sub, className, delta, deltaLabel }: StatCardProps) {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;
  return (
    <Card className={cn("", className)}>
      <CardHeader className="px-4 pt-4 pb-1">
        <CardTitle className="text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-2xl font-semibold tracking-[-0.01em] tabular-nums">{displayValue}</p>
        {delta != null && (
          <p className="mt-1 flex items-center gap-1.5 text-xs leading-4">
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
                <svg
                  aria-hidden
                  width="7"
                  height="7"
                  viewBox="0 0 8 8"
                  className={cn("shrink-0", delta < 0 && "rotate-180")}
                >
                  <path d="M4 0.5 L7.5 6.5 L0.5 6.5 Z" fill="currentColor" />
                </svg>
              )}
              {Math.abs(delta)}%
            </span>
            {deltaLabel ? <span className="text-muted-foreground">{deltaLabel}</span> : null}
          </p>
        )}
        {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
      </CardContent>
    </Card>
  );
}
