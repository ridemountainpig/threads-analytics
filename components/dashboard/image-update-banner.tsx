"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const DISMISSED_DIGEST_KEY = "threads_analytics_dismissed_image_digest";

// The `#updating` anchor is an explicit <a id> in each README, so the links
// survive section title changes.
const UPDATE_GUIDE_URLS: Record<Locale, string> = {
  en: "https://github.com/ridemountainpig/threads-analytics#updating",
  "zh-TW": "https://github.com/ridemountainpig/threads-analytics/blob/main/README-zh.md#updating",
  ja: "https://github.com/ridemountainpig/threads-analytics/blob/main/README-ja.md#updating",
};

interface ImageUpdateResponse {
  supported: boolean;
  updateAvailable: boolean;
  latestDigest: string | null;
}

export default function ImageUpdateBanner({
  locale,
  labels,
}: {
  locale: Locale;
  labels: { newImageAvailable: string; howToUpdate: string; dismiss: string };
}) {
  const [latestDigest, setLatestDigest] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    async function checkForUpdate() {
      try {
        const response = await fetch("/api/status/update", { cache: "no-store" });
        if (!response.ok) return;

        const status = (await response.json()) as ImageUpdateResponse;
        if (disposed || !status.updateAvailable || !status.latestDigest) return;
        if (window.localStorage.getItem(DISMISSED_DIGEST_KEY) === status.latestDigest) return;

        setLatestDigest(status.latestDigest);
      } catch {
        // The banner is best-effort; a failed check should never disturb the dashboard.
      }
    }

    void checkForUpdate();
    return () => {
      disposed = true;
    };
  }, []);

  if (!latestDigest) return null;

  function dismiss() {
    try {
      if (latestDigest) window.localStorage.setItem(DISMISSED_DIGEST_KEY, latestDigest);
    } catch {
      // Private browsing modes may block localStorage; still hide the banner.
    }
    setLatestDigest(null);
  }

  return (
    <div className="bg-muted/50 flex items-center gap-3 border-b px-4 py-2.5 text-sm">
      <RefreshCw className="text-muted-foreground size-4 shrink-0" />
      <p className="min-w-0 flex-1">
        {labels.newImageAvailable}{" "}
        <a
          href={UPDATE_GUIDE_URLS[locale]}
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-2"
        >
          {labels.howToUpdate}
        </a>
      </p>
      <button
        type="button"
        aria-label={labels.dismiss}
        onClick={dismiss}
        className="text-muted-foreground hover:text-foreground shrink-0"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
