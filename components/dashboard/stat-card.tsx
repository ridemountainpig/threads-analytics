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
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-2xl font-semibold tabular-nums">{displayValue}</p>
        {delta != null && (
          <p
            className={cn(
              "mt-0.5 text-xs font-medium",
              delta > 0
                ? "text-green-600 dark:text-green-500"
                : delta < 0
                  ? "text-red-500"
                  : "text-muted-foreground",
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta}%{deltaLabel ? ` ${deltaLabel}` : ""}
          </p>
        )}
        {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
      </CardContent>
    </Card>
  );
}
