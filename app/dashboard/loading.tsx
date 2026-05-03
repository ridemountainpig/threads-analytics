export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="bg-muted h-8 w-40 rounded" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-muted h-24 rounded-lg" />
        ))}
      </div>
      <div className="bg-muted h-64 rounded-lg" />
    </div>
  );
}
