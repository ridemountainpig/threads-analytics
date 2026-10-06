"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Collapse } from "@/components/ui/collapse";
import type { Locale } from "@/lib/i18n";
import { updateGuideUrl } from "@/lib/update-guide";
import { cn } from "@/lib/utils";
import { useUpdateStatus } from "@/components/dashboard/use-update-status";

const DISMISSED_UPDATE_KEY = "threads_analytics_dismissed_update";

export default function UpdateBanner({
  locale,
  labels,
}: {
  locale: Locale;
  labels: { newVersionAvailable: string; howToUpdate: string; download: string; dismiss: string };
}) {
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  // The banner is best-effort; a failed check should never disturb the dashboard.
  const { status } = useUpdateStatus();
  const download = status?.download;
  const latestVersion = status?.latest?.label;

  useEffect(() => {
    if (!status?.updateAvailable || !status.updateId) return;
    try {
      if (window.localStorage.getItem(DISMISSED_UPDATE_KEY) === status.updateId) return;
    } catch {
      // Private browsing modes may block localStorage; show the banner anyway.
    }
    setUpdateId(status.updateId);
  }, [status]);

  function dismiss() {
    try {
      if (updateId) window.localStorage.setItem(DISMISSED_UPDATE_KEY, updateId);
    } catch {
      // Private browsing modes may block localStorage; still hide the banner.
    }
    setDismissed(true);
  }

  // The banner arrives after an async check, so it eases in (and out on
  // dismiss) instead of shoving the dashboard down mid-read.
  return (
    <Collapse open={Boolean(updateId) && !dismissed}>
      <div className="bg-muted/50 border-border/60 flex items-center gap-3 border-b px-4 py-2.5 text-sm">
        <RefreshCw className="text-muted-foreground size-4 shrink-0" />
        <p className="min-w-0 flex-1">
          {labels.newVersionAvailable}{" "}
          <a
            href={updateGuideUrl(locale)}
            target="_blank"
            rel="noreferrer"
            className="text-tint font-medium underline underline-offset-2"
          >
            {labels.howToUpdate}
          </a>
        </p>
        {download && latestVersion && (
          <a
            href={download}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({
                size: "xs",
                className: "rounded-full px-2.5 has-data-[icon=inline-start]:pl-2",
              }),
            )}
          >
            <Download data-icon="inline-start" />
            {labels.download.replace("{version}", latestVersion)}
          </a>
        )}
        <button
          type="button"
          aria-label={labels.dismiss}
          onClick={dismiss}
          className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <X className="size-4" />
        </button>
      </div>
    </Collapse>
  );
}
