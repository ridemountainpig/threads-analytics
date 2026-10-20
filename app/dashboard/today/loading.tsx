import { PageHeaderSkeleton } from "@/components/dashboard/page-header";
import { StatCardSkeleton } from "@/components/dashboard/stat-card";

export default function TodayLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 motion-reduce:animate-none sm:p-6">
      <PageHeaderSkeleton />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            // Same tile class as page.tsx.
            <StatCardSkeleton key={i} sub className="max-sm:gap-2 max-sm:py-0" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
          <div className="bg-muted h-8 w-36 rounded-full lg:hidden" />
          <div className="bg-muted h-96 rounded-xl lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1" />
          <div className="bg-muted hidden h-48 rounded-xl lg:col-start-3 lg:row-start-2 lg:block" />
          <div className="space-y-4 lg:col-start-3 lg:row-start-1">
            <div className="bg-muted h-60 rounded-xl" />
            <div className="bg-muted h-36 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
