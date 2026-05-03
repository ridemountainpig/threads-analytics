"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";

export type AnalyticsTabValue = "performance" | "content";

function tabFromParams(params: URLSearchParams): AnalyticsTabValue | null {
  const t = params.get("tab");
  if (t === "content" || t === "performance") return t;
  return null;
}

/** Prefer the real location bar — useSearchParams() can be empty on first paint (static/SSR). */
function paramsFromBrowser(searchParams: ReturnType<typeof useSearchParams>): URLSearchParams {
  if (typeof window !== "undefined" && window.location.search.length > 1) {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams(searchParams.toString());
}

export default function AnalyticsTabs({
  defaultTab,
  children,
}: {
  defaultTab: AnalyticsTabValue;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<AnalyticsTabValue>(defaultTab);

  // After hydration, align with the actual URL (fixes refresh + stale useSearchParams).
  useLayoutEffect(() => {
    const fromUrl = tabFromParams(paramsFromBrowser(searchParams));
    if (fromUrl) {
      setValue(fromUrl);
    }
  }, [searchParams]);

  const onValueChange = useCallback(
    (next: string | number | null) => {
      const raw = next != null ? String(next) : "";
      const v: AnalyticsTabValue = raw === "content" ? "content" : "performance";
      setValue(v);
      const params = paramsFromBrowser(searchParams);
      params.set("tab", v);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <Tabs value={value} onValueChange={onValueChange}>
      {children}
    </Tabs>
  );
}
