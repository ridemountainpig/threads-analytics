"use client";

import { LOCALE_COOKIE, dictionaries, isLocale } from "@/lib/i18n";

function getLocaleFromCookie() {
  if (typeof document === "undefined") return "en" as const;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : undefined;
  return isLocale(value) ? value : ("en" as const);
}

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = dictionaries[getLocaleFromCookie()].common;
  return (
    <div className="space-y-3 p-8">
      <h2 className="text-lg font-semibold">{t.errorTitle}</h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <button onClick={reset} className="text-primary text-sm underline">
        {t.tryAgain}
      </button>
    </div>
  );
}
