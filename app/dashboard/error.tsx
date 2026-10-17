"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOCALE_COOKIE, dictionaries, isLocale } from "@/lib/i18n";

function getLocaleFromCookie() {
  if (typeof document === "undefined") return "en" as const;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : undefined;
  return isLocale(value) ? value : ("en" as const);
}

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = dictionaries[getLocaleFromCookie()].common;
  const [beforeDigest, afterDigest] = t.errorDigest.split("{digest}");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="relative size-14">
        <div className="bg-muted absolute inset-0 rotate-6 rounded-2xl" />
        <div className="ring-border bg-card absolute inset-0 flex items-center justify-center rounded-2xl ring-1">
          <TriangleAlert className="text-destructive size-6" />
        </div>
      </div>
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-medium">{t.errorTitle}</h2>
        <p className="text-muted-foreground mx-auto max-w-xs text-sm text-balance">{t.errorHelp}</p>
        {/* In production the message is a generic English sentence. */}
        {process.env.NODE_ENV === "development" && (
          <p className="text-muted-foreground mx-auto max-w-sm font-mono text-xs break-words">
            {error.message}
          </p>
        )}
        {error.digest && (
          <p className="text-muted-foreground pt-1 text-xs">
            {beforeDigest}
            <span className="font-mono select-all">{error.digest}</span>
            {afterDigest}
          </p>
        )}
      </div>
      <Button size="lg" className="rounded-full" onClick={() => retry()}>
        <RefreshCw className="mr-1.5 size-4" />
        {t.tryAgain}
      </Button>
    </div>
  );
}
