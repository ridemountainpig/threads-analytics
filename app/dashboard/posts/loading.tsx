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
        <div className="lg:w-[40%] lg:border-r">
          <div className="space-y-2 border-b px-4 py-2.5">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <div className="bg-muted/70 mr-0.5 h-3 w-8 shrink-0 rounded-md" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-muted h-7 w-14 shrink-0 rounded-full max-sm:h-8" />
              ))}
              <div className="bg-muted size-7 shrink-0 rounded-full max-sm:size-8" />
            </div>
            <div className="bg-muted/70 h-9 rounded-full sm:h-8" />
            <div className="flex gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-muted/70 h-6 w-12 rounded-full max-sm:h-8" />
              ))}
            </div>
          </div>
          <div className="p-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5 px-3 py-3">
                <div className="bg-muted h-3.5 rounded-md" />
                <div className="bg-muted h-3.5 w-4/5 rounded-md" />
                <div className="bg-muted/70 mt-2.5 h-3 w-1/2 rounded-md" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden flex-1 p-6 lg:block">
          <div className="space-y-2">
            <div className="bg-muted h-4 rounded-md" />
            <div className="bg-muted h-4 w-5/6 rounded-md" />
            <div className="bg-muted h-4 w-2/3 rounded-md" />
          </div>
          <div className="bg-muted/70 mt-4 h-4 w-1/2 rounded-md" />
          <div className="divide-border/60 border-border/60 mt-5 grid grid-cols-3 divide-x border-t pt-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2 px-6 first:pl-0 last:pr-0">
                <div className="bg-muted/70 h-3 w-16 rounded-md" />
                <div className="bg-muted h-7 w-20 rounded-md" />
              </div>
            ))}
          </div>
          <div className="bg-muted/70 mt-10 h-[180px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
