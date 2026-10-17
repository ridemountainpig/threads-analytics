import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeaderSkeleton } from "@/components/dashboard/page-header";
import { StatCardSkeleton } from "@/components/dashboard/stat-card";

// Mirrors the analytics layout at its real sizes so content lands without
// shifting; chart heights match the Performance tab's first cards.
function ChartCardSkeleton({
  chartHeight,
  className,
}: {
  chartHeight: number;
  className?: string;
}) {
  return (
    <Card aria-hidden className={className}>
      <CardHeader>
        <div className="min-w-0 space-y-0.5 pr-8">
          <div className="text-[11px] leading-snug">
            <span className="bg-muted inline-block h-2.5 w-32 rounded-md align-middle" />
          </div>
          <div className="text-xs">
            <span className="bg-muted/70 inline-block h-3 w-full max-w-72 rounded-md align-middle" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/60 rounded-lg" style={{ height: chartHeight }} />
      </CardContent>
    </Card>
  );
}

export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 motion-reduce:animate-none sm:p-6">
      <PageHeaderSkeleton range />
      <div className="flex flex-col gap-2">
        <div className="bg-muted/70 h-8 w-68 rounded-full" />
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <ChartCardSkeleton chartHeight={348} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <ChartCardSkeleton className="lg:col-span-3" chartHeight={288} />
            <ChartCardSkeleton className="lg:col-span-2" chartHeight={270} />
          </div>
        </div>
      </div>
    </div>
  );
}
