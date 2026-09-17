// Mirrors the posts layout — header with range controls, then the split
// list/detail panel with its toolbar rows.
export default function PostsLoading() {
  return (
    <div className="animate-pulse space-y-4 p-4 motion-reduce:animate-none sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="bg-muted h-7 w-40 rounded-md" />
          <div className="bg-muted/70 h-4 w-24 rounded-md" />
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted h-7 w-12 rounded-full" />
          ))}
        </div>
      </div>
      <div className="ring-foreground/10 flex min-h-[520px] flex-col overflow-hidden rounded-xl ring-1 lg:h-[calc(100vh-10rem)] lg:flex-row">
        <div className="border-b lg:w-[40%] lg:border-r lg:border-b-0">
          <div className="space-y-2 border-b px-4 py-2.5">
            <div className="flex gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-muted h-7 w-16 rounded-full" />
              ))}
            </div>
            <div className="bg-muted/70 h-8 rounded-full" />
          </div>
          <div className="space-y-4 px-4 py-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="bg-muted h-4 rounded-md" />
                <div className="bg-muted/70 h-3 w-2/3 rounded-md" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden flex-1 space-y-4 p-6 lg:block">
          <div className="bg-muted h-5 w-3/4 rounded-md" />
          <div className="bg-muted/70 h-4 w-1/2 rounded-md" />
          <div className="grid grid-cols-3 gap-4 pt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-muted h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
