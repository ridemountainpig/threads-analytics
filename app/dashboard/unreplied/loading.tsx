import { PageHeaderSkeleton } from "@/components/dashboard/page-header";
import { StatCardSkeleton } from "@/components/dashboard/stat-card";

export default function UnrepliedLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 motion-reduce:animate-none sm:p-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <StatCardSkeleton key={i} sub className={i === 2 ? "max-md:col-span-2" : undefined} />
        ))}
      </div>
      <div className="bg-muted h-96 rounded-xl" />
    </div>
  );
}
