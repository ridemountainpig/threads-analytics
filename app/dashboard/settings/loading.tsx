// Mirrors the settings layout — header, then the stacked settings cards.
export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 motion-reduce:animate-none sm:p-6">
      <div className="space-y-2">
        <div className="bg-muted h-7 w-40 rounded-md" />
        <div className="bg-muted/70 h-4 w-56 rounded-md" />
      </div>
      <div className="space-y-4">
        <div className="bg-muted h-64 rounded-xl" />
        <div className="bg-muted h-56 rounded-xl" />
        <div className="bg-muted/70 h-40 rounded-xl" />
        <div className="bg-muted/70 h-40 rounded-xl" />
      </div>
    </div>
  );
}
