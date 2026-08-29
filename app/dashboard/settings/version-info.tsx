"use client";

import { ArrowUpRight, CheckCircle2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n";
import type { ImageVersionLink } from "@/lib/image-update";
import { UPDATE_GUIDE_URLS } from "@/lib/update-guide";
import { useImageUpdateStatus } from "@/components/dashboard/use-image-update-status";

type UpdateState = "checking" | "upToDate" | "updateAvailable" | "unavailable";

export default function VersionInfo({
  version,
  locale,
  labels,
}: {
  version: ImageVersionLink | null;
  locale: Locale;
  labels: {
    currentVersion: string;
    sourceBuild: string;
    sourceBuildHelp: string;
    checking: string;
    upToDate: string;
    updateAvailable: string;
    checkFailed: string;
    howToUpdate: string;
  };
}) {
  const { status, failed } = useImageUpdateStatus(Boolean(version));

  let updateState: UpdateState = "checking";
  if (failed) updateState = "unavailable";
  else if (status) {
    if (status.updateAvailable) updateState = "updateAvailable";
    // `checked` is false when the server-side GHCR check failed or was
    // partial, so "you're up to date" is only claimed when it is true.
    else if (status.supported && status.checked) updateState = "upToDate";
    else updateState = "unavailable";
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{labels.currentVersion}</span>
        {version ? (
          <Badge
            variant="secondary"
            render={<a href={version.url} target="_blank" rel="noreferrer" />}
            className="bg-muted/70 text-foreground/70 hover:bg-muted hover:text-foreground h-auto gap-1 rounded-full px-2.5 py-1 font-mono transition-colors duration-150 motion-reduce:transition-none"
          >
            {version.tag}
            <ArrowUpRight className="opacity-60" />
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">{labels.sourceBuild}</span>
        )}
      </div>

      {version ? (
        <div className="border-t pt-3 text-sm">
          {updateState === "checking" && <p className="text-muted-foreground">{labels.checking}</p>}
          {updateState === "unavailable" && (
            <p className="text-muted-foreground">{labels.checkFailed}</p>
          )}
          {updateState === "upToDate" && (
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-green-600" />
              {labels.upToDate}
            </p>
          )}
          {updateState === "updateAvailable" && (
            <p className="flex items-center gap-2">
              <RefreshCw className="size-4 shrink-0 text-amber-600 dark:text-amber-500" />
              <span className="min-w-0">
                {labels.updateAvailable}{" "}
                <a
                  href={UPDATE_GUIDE_URLS[locale]}
                  target="_blank"
                  rel="noreferrer"
                  className="text-tint font-medium underline underline-offset-2 hover:opacity-80"
                >
                  {labels.howToUpdate}
                </a>
              </span>
            </p>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground border-t pt-3 text-sm">{labels.sourceBuildHelp}</p>
      )}
    </div>
  );
}
