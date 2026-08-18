// Skeletons mirror the overview layout — header row, stat-tile grid, chart
// card — with the cards' real radii so nothing jumps when content lands.
export default function DashboardLoading() {
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-muted h-24 rounded-xl" />
        ))}
      </div>
      <div className="bg-muted h-72 rounded-xl" />
    </div>
  );
}
