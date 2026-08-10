"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw, ArrowRight, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncDataAction } from "@/actions/sync";
import { toast } from "sonner";

const INTERVAL_LABELS: Record<string, string> = {
  "60": "every hour",
  "360": "every 6 hours",
  "1440": "daily",
};

const STALE_AFTER_DAYS = 7;

interface SyncButtonProps {
  lastSyncedAt?: string | null;
  syncInterval?: string;
  timeZone: string;
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
    staleNotice?: string;
    staleHintManual?: string;
    staleHintAuto?: string;
    goToSettings?: string;
  };
  dateLocale?: string;
}

function formatDateTime(date: string, dateLocale: string, timeZone: string) {
  return new Intl.DateTimeFormat(dateLocale, {
    timeZone,
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
  timeZone,
  labels,
  dateLocale,
}: SyncButtonProps) {
  const [pending, startTransition] = useTransition();
  const [staleOpen, setStaleOpen] = useState(false);
  // The popover's settings CTA is pointless when we're already on the settings page.
  const onSettingsPage = usePathname()?.startsWith("/dashboard/settings") ?? false;
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

  const staleDays = lastSyncedAt
    ? Math.floor((Date.now() - new Date(lastSyncedAt).getTime()) / 86400000)
    : 0;
  const isStale = staleDays >= STALE_AFTER_DAYS && Boolean(copy.staleNotice);
  const staleHint = syncInterval === "0" ? copy.staleHintManual : copy.staleHintAuto;

  return (
    <div className="flex max-w-full min-w-0 flex-col items-end gap-1">
      <div className="flex max-w-full flex-wrap items-center justify-end gap-x-3 gap-y-1">
        {lastSyncedAt && (
          <span className="text-muted-foreground text-xs">
            {copy.lastSynced} {formatDateTime(lastSyncedAt, dateLocale ?? "en-US", timeZone)}
          </span>
        )}
        <div className="group relative">
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
          {isStale && (
            <>
              {/* Tap target for touch devices; desktop can also just hover the button. */}
              <button
                type="button"
                aria-label={copy.staleNotice?.replace("{days}", String(staleDays))}
                onClick={() => setStaleOpen((open) => !open)}
                className="absolute -top-2 -right-2 z-20 hidden size-5 items-center justify-center sm:flex"
              >
                <span className="absolute size-2.5 animate-ping rounded-full bg-amber-500/60" />
                <span className="relative size-2.5 rounded-full bg-amber-500" />
              </button>
              {staleOpen && (
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setStaleOpen(false)}
                  aria-hidden="true"
                />
              )}
              {/* pt-2 keeps the gap inside the hover area so the popover doesn't
                  close while the cursor travels from the button to the card. */}
              <div
                className={`absolute top-full right-0 z-20 pt-2 ${
                  staleOpen ? "block" : "hidden group-hover:block"
                }`}
              >
                <div className="border-border bg-popover text-popover-foreground w-64 rounded-md border p-3 text-left shadow-md">
                  <p className="text-xs font-medium">
                    {copy.staleNotice?.replace("{days}", String(staleDays))}
                  </p>
                  {staleHint && <p className="text-muted-foreground mt-1 text-xs">{staleHint}</p>}
                  {copy.goToSettings && !onSettingsPage && (
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setStaleOpen(false)}
                      className="text-primary hover:text-primary/80 mt-2 inline-flex items-center gap-1 text-xs font-medium"
                    >
                      {copy.goToSettings}
                      <ArrowRight className="size-3" />
                    </Link>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* No hover on touch screens, so small viewports get an inline banner instead
          of the dot + popover. */}
      {isStale && (
        <div className="mt-1 w-full rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-left sm:hidden">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="min-w-0">
              <p className="text-xs font-medium">
                {copy.staleNotice?.replace("{days}", String(staleDays))}
              </p>
              {staleHint && <p className="text-muted-foreground mt-0.5 text-xs">{staleHint}</p>}
              {copy.goToSettings && !onSettingsPage && (
                <Link
                  href="/dashboard/settings"
                  className="text-primary hover:text-primary/80 mt-1.5 inline-flex items-center gap-1 text-xs font-medium"
                >
                  {copy.goToSettings}
                  <ArrowRight className="size-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
