"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncDataAction } from "@/actions/sync";
import { toast } from "sonner";

const INTERVAL_LABELS: Record<string, string> = {
  "60": "every hour",
  "360": "every 6 hours",
  "1440": "daily",
};

interface SyncButtonProps {
  lastSyncedAt?: string | null;
  syncInterval?: string;
  labels?: {
    sync: string;
    syncing: string;
    lastSynced: string;
    autoSyncs: string;
    tokenExpired: string;
    failed: string;
    synced: string;
    inProgress?: string;
    intervalInline: Record<string, string>;
  };
  dateLocale?: string;
}

function formatDateTime(date: string, dateLocale = "en-US") {
  return new Intl.DateTimeFormat(dateLocale, {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function SyncButton({
  lastSyncedAt,
  syncInterval,
  labels,
  dateLocale,
}: SyncButtonProps) {
  const [pending, startTransition] = useTransition();
  const copy = labels ?? {
    sync: "Sync",
    syncing: "Syncing...",
    lastSynced: "Last synced",
    autoSyncs: "Auto-syncs",
    tokenExpired: "Access token expired. Please reconnect in Settings.",
    failed: "Sync failed:",
    synced: "Synced {count} posts",
    intervalInline: INTERVAL_LABELS,
  };

  function handleSync() {
    startTransition(async () => {
      const result = await syncDataAction();
      if (result.error === "token_expired") {
        toast.error(copy.tokenExpired);
      } else if (result.error === "sync_in_progress") {
        toast.info(copy.inProgress ?? "A sync is already in progress. Please wait.");
      } else if (result.error) {
        toast.error(`${copy.failed} ${result.error}`);
      } else {
        toast.success(copy.synced.replace("{count}", String(result.postsCount)));
      }
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        {lastSyncedAt && (
          <span className="text-muted-foreground text-xs" suppressHydrationWarning>
            {copy.lastSynced} {formatDateTime(lastSyncedAt, dateLocale)}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={handleSync}
          disabled={pending}
        >
          <RefreshCw className={`mr-1.5 size-3.5 ${pending ? "animate-spin" : ""}`} />
          {pending ? copy.syncing : copy.sync}
        </Button>
      </div>
    </div>
  );
}
