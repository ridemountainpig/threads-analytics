// Mirrors the analytics layout — header with range controls, tab pill,
// stat tiles, then the chart stack.
export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 motion-reduce:animate-none sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="bg-muted h-7 w-40 rounded-md" />
          <div className="bg-muted/70 h-4 w-56 rounded-md" />
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted h-7 w-12 rounded-full" />
          ))}
        </div>
      </div>
      <div>
        <div className="bg-muted/70 h-8 w-64 rounded-full" />
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-muted h-24 rounded-xl" />
            ))}
          </div>
          <div className="bg-muted h-72 rounded-xl" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="bg-muted h-64 rounded-xl lg:col-span-3" />
            <div className="bg-muted h-64 rounded-xl lg:col-span-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
