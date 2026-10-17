import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeaderSkeleton } from "@/components/dashboard/page-header";
import { StatCardSkeleton } from "@/components/dashboard/stat-card";
import { SummaryCardSkeleton } from "@/components/dashboard/summary-card";

export default function OverviewLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 motion-reduce:animate-none sm:p-6">
      <PageHeaderSkeleton range />
      <SummaryCardSkeleton />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCardSkeleton key={i} trend delta />
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <StatCardSkeleton key={i + 4} size="sm" delta />
        ))}
      </div>
      <Card aria-hidden>
        <CardHeader>
          <CardTitle className="text-[11px]">
            <span className="bg-muted inline-block h-2.5 w-24 rounded-sm align-middle" />
          </CardTitle>
          <p className="text-xs">
            <span className="bg-muted/70 inline-block h-3 w-64 max-w-full rounded-sm align-middle" />
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/70 h-[256px] rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
