// Mirrors the giveaway layout — header, then the 2:3 setup/results columns.
export default function GiveawayLoading() {
  return (
    <div className="animate-pulse space-y-4 p-4 motion-reduce:animate-none sm:p-6">
      <div className="space-y-2">
        <div className="bg-muted h-7 w-40 rounded-md" />
        <div className="bg-muted/70 h-4 w-56 rounded-md" />
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="bg-muted h-[30rem] rounded-xl lg:col-span-2" />
        <div className="bg-muted/70 h-[30rem] rounded-xl lg:col-span-3" />
      </div>
    </div>
  );
}
