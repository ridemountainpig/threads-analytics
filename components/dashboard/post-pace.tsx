import { cn } from "@/lib/utils";

export function VsTypicalBadge({
  vsTypical,
  className,
}: {
  vsTypical: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
        vsTypical >= 1
          ? "bg-green-600/10 text-green-700 dark:bg-green-500/15 dark:text-green-400"
          : "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400",
        className,
      )}
    >
      <svg
        aria-hidden
        width="7"
        height="7"
        viewBox="0 0 8 8"
        className={cn("shrink-0", vsTypical < 1 && "rotate-180")}
      >
        <path d="M4 0.5 L7.5 6.5 L0.5 6.5 Z" fill="currentColor" />
      </svg>
      {vsTypical}x
    </span>
  );
}
