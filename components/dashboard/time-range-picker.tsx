"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESETS = ["7", "30", "90", "180", "365", "all"] as const;
type PresetOption = (typeof PRESETS)[number];

const PRESET_LABELS: Record<PresetOption, string> = {
  "7": "7d",
  "30": "30d",
  "90": "90d",
  "180": "6m",
  "365": "1y",
  all: "All",
};

interface TimeRangePickerProps {
  locale?: string;
  labels?: {
    all: string;
    custom: string;
    apply: string;
    cancel?: string;
    halfYear?: string;
    oneYear?: string;
  };
  defaultRange?: string;
  defaultFrom?: string;
  defaultTo?: string;
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export default function TimeRangePicker({
  locale,
  labels,
  defaultRange,
  defaultFrom,
  defaultTo,
}: TimeRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlHasCustom = searchParams.has("from") && searchParams.has("to");
  const urlHasRange = searchParams.has("range");
  const hasCustom = urlHasCustom || (!urlHasRange && !!(defaultFrom && defaultTo));
  const currentRange = hasCustom ? "custom" : (searchParams.get("range") ?? defaultRange ?? "90");

  const [showCustom, setShowCustom] = useState(hasCustom);
  const [fromVal, setFromVal] = useState(searchParams.get("from") ?? defaultFrom ?? "");
  const [toVal, setToVal] = useState(searchParams.get("to") ?? defaultTo ?? "");
  const dateInputLang = locale?.startsWith("zh") ? "zh-TW" : "en-CA";

  function currentParams(): URLSearchParams {
    if (typeof window !== "undefined" && window.location.search.length > 1) {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams(searchParams.toString());
  }

  function setPreset(value: PresetOption) {
    const params = currentParams();
    params.set("range", value);
    params.delete("from");
    params.delete("to");
    params.delete("page");
    setCookie("ta_range", value);
    deleteCookie("ta_range_from");
    deleteCookie("ta_range_to");
    router.push(`${pathname}?${params.toString()}`);
    setShowCustom(false);
  }

  function applyCustom() {
    if (!fromVal || !toVal) return;
    const params = currentParams();
    params.set("from", fromVal);
    params.set("to", toVal);
    params.delete("range");
    params.delete("page");
    setCookie("ta_range_from", fromVal);
    setCookie("ta_range_to", toVal);
    deleteCookie("ta_range");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex w-full flex-col gap-2 lg:w-auto lg:items-end">
      {showCustom ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <input
            type="date"
            lang={dateInputLang}
            value={fromVal}
            onChange={(e) => setFromVal(e.target.value)}
            className="bg-background border-input h-7 min-w-32 rounded-md border px-2 text-xs"
          />
          <span className="text-muted-foreground text-xs">–</span>
          <input
            type="date"
            lang={dateInputLang}
            value={toVal}
            onChange={(e) => setToVal(e.target.value)}
            className="bg-background border-input h-7 min-w-32 rounded-md border px-2 text-xs"
          />
          <Button size="sm" className="h-7 px-2.5 text-xs" onClick={applyCustom}>
            {labels?.apply ?? "Apply"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => setShowCustom(false)}
          >
            {labels?.cancel ?? "Cancel"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap justify-end gap-1">
          {PRESETS.map((opt) => (
            <Button
              key={opt}
              variant={currentRange === opt ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-7 px-2.5 text-xs",
                currentRange === opt && "bg-primary text-primary-foreground",
              )}
              onClick={() => setPreset(opt)}
            >
              {opt === "all"
                ? (labels?.all ?? PRESET_LABELS[opt])
                : opt === "180"
                  ? (labels?.halfYear ?? PRESET_LABELS["180"])
                  : opt === "365"
                    ? (labels?.oneYear ?? PRESET_LABELS["365"])
                    : PRESET_LABELS[opt]}
            </Button>
          ))}
          <Button
            variant={currentRange === "custom" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-7 px-2.5 text-xs",
              currentRange === "custom" && "bg-primary text-primary-foreground",
            )}
            onClick={() => setShowCustom(true)}
          >
            {labels?.custom ?? "Custom"}
          </Button>
        </div>
      )}
    </div>
  );
}
