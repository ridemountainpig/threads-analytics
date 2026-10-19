"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { useSyncNow, type SyncNowLabels } from "@/components/dashboard/sync-button";
import { Collapse } from "@/components/ui/collapse";
import { cn } from "@/lib/utils";

export interface StaleNoticeLabels extends SyncNowLabels {
  message: string;
  sync: string;
  syncing: string;
}

// Rendered even when fresh, so a finished sync collapses the notice instead of cutting it out.
export default function StaleNotice({
  stale,
  labels,
  className,
}: {
  stale: boolean;
  labels: StaleNoticeLabels;
  className?: string;
}) {
  const { pending, sync } = useSyncNow(labels);

  return (
    // The page's space-y-6 gap moves inside as pb-6, so it collapses with the notice.
    <Collapse open={stale} className={cn("mb-0", className)}>
      <div className="pb-6">
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 py-1.5 pr-1.5 pl-3">
          <TriangleAlert
            aria-hidden
            className="size-3.5 shrink-0 text-amber-600 dark:text-amber-500"
          />
          <p className="min-w-0 flex-1 text-xs">{labels.message}</p>
          <button
            type="button"
            onClick={sync}
            disabled={pending}
            className="bg-tint/12 text-tint hover:bg-tint/18 relative inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-[background-color,color,scale] duration-150 after:absolute after:inset-x-0 after:-inset-y-2 active:scale-[0.96] disabled:opacity-60 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <RefreshCw
              aria-hidden
              className={cn("size-3.5", pending && "animate-spin motion-reduce:animate-none")}
            />
            {pending ? labels.syncing : labels.sync}
          </button>
        </div>
      </div>
    </Collapse>
  );
}
