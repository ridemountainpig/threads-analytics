"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw, ArrowRight, TriangleAlert } from "lucide-react";
import { syncDataAction } from "@/actions/sync";
import { cn } from "@/lib/utils";
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
          <span className="text-muted-foreground text-xs tabular-nums">
            {copy.lastSynced} {formatDateTime(lastSyncedAt, dateLocale ?? "en-US", timeZone)}
          </span>
        )}
        <div className="group relative">
          <button
            type="button"
            onClick={handleSync}
            disabled={pending}
            className="bg-tint/12 text-tint hover:bg-tint/18 inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.96] disabled:opacity-60 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <RefreshCw
              className={`size-3.5 ${pending ? "animate-spin motion-reduce:animate-none" : ""}`}
            />
            {pending ? copy.syncing : copy.sync}
          </button>
          {isStale && (
            <>
              {/* Tap target for touch devices; desktop can also just hover the button. */}
              <button
                type="button"
                aria-label={copy.staleNotice?.replace("{days}", String(staleDays))}
                onClick={() => setStaleOpen((open) => !open)}
                className="absolute -top-2 -right-2 z-20 hidden size-5 items-center justify-center sm:flex"
              >
                <span className="absolute size-2.5 animate-ping rounded-full bg-amber-500/60 motion-reduce:animate-none" />
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
                  close while the cursor travels from the button to the card.
                  The card materializes — fades and scales from its top-right
                  anchor — rather than snapping in; while hidden it's
                  visibility:hidden so the empty space can't catch hovers. */}
              <div className="pointer-events-none absolute top-full right-0 z-20 pt-2">
                <div
                  className={cn(
                    "border-foreground/10 bg-popover/85 text-popover-foreground reduce-transparency:bg-popover reduce-transparency:backdrop-blur-none more-contrast:border-foreground/25 pointer-events-auto w-64 origin-top-right rounded-xl border p-3 text-left shadow-[0_12px_32px_-8px_color-mix(in_oklch,var(--foreground)_30%,transparent)] backdrop-blur-xl transition-[opacity,scale,visibility] duration-200 ease-out motion-reduce:scale-100 motion-reduce:transition-[opacity,visibility]",
                    staleOpen
                      ? "visible scale-100 opacity-100"
                      : "invisible scale-95 opacity-0 group-hover:visible group-hover:scale-100 group-hover:opacity-100",
                  )}
                >
                  <p className="text-xs font-medium">
                    {copy.staleNotice?.replace("{days}", String(staleDays))}
                  </p>
                  {staleHint && <p className="text-muted-foreground mt-1 text-xs">{staleHint}</p>}
                  {copy.goToSettings && !onSettingsPage && (
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setStaleOpen(false)}
                      className="text-tint mt-2 inline-flex items-center gap-1 text-xs font-medium hover:opacity-80"
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
        <div className="mt-1 w-full rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-left sm:hidden">
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
                  className="text-tint mt-1.5 inline-flex items-center gap-1 text-xs font-medium hover:opacity-80"
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
