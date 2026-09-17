// Mirrors the token guide's reading column — back link, title, body copy.
export default function TokenGuideLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-6 p-4 motion-reduce:animate-none sm:p-6">
      <div className="bg-muted/70 h-4 w-24 rounded-md" />
      <div className="space-y-4">
        <div className="bg-muted h-7 w-64 rounded-md" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-muted/70 h-4 rounded-md" />
        ))}
        <div className="bg-muted h-56 rounded-xl" />
      </div>
    </div>
  );
}
