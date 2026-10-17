"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSyncNow, type SyncNowLabels } from "@/components/dashboard/sync-button";
import { cn } from "@/lib/utils";

interface FirstSyncNoticeLabels extends SyncNowLabels {
  message: string;
  help: string;
  syncNow: string;
  syncing: string;
}

export function FirstSyncNotice({ labels }: { labels: FirstSyncNoticeLabels }) {
  const { pending, sync: handleSync } = useSyncNow(labels);
  // `notSynced` ends with sentence punctuation for inline use; drop it for the heading.
  const heading = labels.message.replace(/[。．.!！]+\s*$/, "");

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center gap-6 p-8 text-center md:min-h-dvh">
      <div className="relative size-14">
        <div className="bg-muted absolute inset-0 rotate-6 rounded-2xl" />
        <div className="ring-border bg-card absolute inset-0 flex items-center justify-center rounded-2xl ring-1">
          <RefreshCw
            className={cn(
              "text-muted-foreground size-6",
              pending && "animate-spin motion-reduce:animate-none",
            )}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-medium">{heading}</h2>
        <p className="text-muted-foreground mx-auto max-w-xs text-sm text-balance">{labels.help}</p>
      </div>
      <Button size="lg" className="rounded-full" onClick={handleSync} disabled={pending}>
        <RefreshCw
          className={cn("mr-1.5 size-4", pending && "animate-spin motion-reduce:animate-none")}
        />
        {pending ? labels.syncing : labels.syncNow}
      </Button>
    </div>
  );
}
