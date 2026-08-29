"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Collapse } from "@/components/ui/collapse";
import type { Locale } from "@/lib/i18n";
import { UPDATE_GUIDE_URLS } from "@/lib/update-guide";
import { useImageUpdateStatus } from "@/components/dashboard/use-image-update-status";

const DISMISSED_DIGEST_KEY = "threads_analytics_dismissed_image_digest";

export default function ImageUpdateBanner({
  locale,
  labels,
}: {
  locale: Locale;
  labels: { newImageAvailable: string; howToUpdate: string; dismiss: string };
}) {
  const [latestDigest, setLatestDigest] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  // The banner is best-effort; a failed check should never disturb the dashboard.
  const { status } = useImageUpdateStatus();

  useEffect(() => {
    if (!status?.updateAvailable || !status.latestDigest) return;
    try {
      if (window.localStorage.getItem(DISMISSED_DIGEST_KEY) === status.latestDigest) return;
    } catch {
      // Private browsing modes may block localStorage; show the banner anyway.
    }
    setLatestDigest(status.latestDigest);
  }, [status]);

  function dismiss() {
    try {
      if (latestDigest) window.localStorage.setItem(DISMISSED_DIGEST_KEY, latestDigest);
    } catch {
      // Private browsing modes may block localStorage; still hide the banner.
    }
    setDismissed(true);
  }

  // The banner arrives after an async check, so it eases in (and out on
  // dismiss) instead of shoving the dashboard down mid-read.
  return (
    <Collapse open={Boolean(latestDigest) && !dismissed}>
      <div className="bg-muted/50 border-border/60 flex items-center gap-3 border-b px-4 py-2.5 text-sm">
        <RefreshCw className="text-muted-foreground size-4 shrink-0" />
        <p className="min-w-0 flex-1">
          {labels.newImageAvailable}{" "}
          <a
            href={UPDATE_GUIDE_URLS[locale]}
            target="_blank"
            rel="noreferrer"
            className="text-tint font-medium underline underline-offset-2"
          >
            {labels.howToUpdate}
          </a>
        </p>
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
