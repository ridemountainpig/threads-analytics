"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncDataAction } from "@/actions/sync";
import { toast } from "sonner";

interface FirstSyncNoticeLabels {
  message: string;
  help: string;
  syncNow: string;
  syncing: string;
  inProgress: string;
  tokenExpired: string;
  failed: string;
  synced: string;
}

export function FirstSyncNotice({ labels }: { labels: FirstSyncNoticeLabels }) {
  const [pending, startTransition] = useTransition();
  // `notSynced` ends with sentence punctuation for inline use; drop it for the heading.
  const heading = labels.message.replace(/[。．.!！]+\s*$/, "");

  function handleSync() {
    startTransition(async () => {
      const result = await syncDataAction();
      if (result.error === "token_expired") {
        toast.error(labels.tokenExpired);
      } else if (result.error === "sync_in_progress") {
        toast.info(labels.inProgress);
      } else if (result.error) {
        toast.error(`${labels.failed} ${result.error}`);
      } else {
        toast.success(labels.synced.replace("{count}", String(result.postsCount)));
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="relative size-14">
        <div className="bg-muted absolute inset-0 rotate-6 rounded-2xl" />
        <div className="ring-border bg-card absolute inset-0 flex items-center justify-center rounded-2xl ring-1">
          <RefreshCw className={`text-muted-foreground size-6 ${pending ? "animate-spin" : ""}`} />
        </div>
      </div>
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-medium">{heading}</h2>
        <p className="text-muted-foreground mx-auto max-w-xs text-sm text-balance">{labels.help}</p>
      </div>
      <Button size="lg" onClick={handleSync} disabled={pending}>
        <RefreshCw className={`mr-1.5 size-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? labels.syncing : labels.syncNow}
      </Button>
    </div>
  );
}
