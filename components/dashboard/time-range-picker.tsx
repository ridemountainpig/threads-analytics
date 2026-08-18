"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Collapse } from "@/components/ui/collapse";
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
    fromDate?: string;
    toDate?: string;
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

  // The two modes swap via paired collapses, so the row morphs between the
  // preset chips and the custom-date fields instead of hard-cutting.
  return (
    <div className="flex w-full flex-col lg:w-auto lg:items-end">
      <Collapse open={showCustom} className="w-full">
        <div className="flex flex-wrap items-center justify-end gap-2 py-0.5">
          <input
            type="date"
            lang={dateInputLang}
            aria-label={labels?.fromDate ?? "Start date"}
            value={fromVal}
            onChange={(e) => setFromVal(e.target.value)}
            className="bg-muted/70 focus-visible:ring-ring/40 h-7 min-w-32 rounded-full px-3 text-xs tabular-nums transition-[background-color,box-shadow] duration-150 outline-none focus-visible:ring-2 motion-reduce:transition-none"
          />
          <span className="text-muted-foreground text-xs">–</span>
          <input
            type="date"
            lang={dateInputLang}
            aria-label={labels?.toDate ?? "End date"}
            value={toVal}
            onChange={(e) => setToVal(e.target.value)}
            className="bg-muted/70 focus-visible:ring-ring/40 h-7 min-w-32 rounded-full px-3 text-xs tabular-nums transition-[background-color,box-shadow] duration-150 outline-none focus-visible:ring-2 motion-reduce:transition-none"
          />
          <button
            type="button"
            onClick={applyCustom}
            className="bg-primary text-primary-foreground h-7 rounded-full px-3 text-xs font-medium transition-[background-color,transform] duration-150 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {labels?.apply ?? "Apply"}
          </button>
          <button
            type="button"
            onClick={() => setShowCustom(false)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/70 h-7 rounded-full px-3 text-xs transition-[background-color,color,transform] duration-150 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {labels?.cancel ?? "Cancel"}
          </button>
        </div>
      </Collapse>
      <Collapse open={!showCustom} className="w-full">
        <div className="flex flex-wrap justify-end gap-1.5 py-0.5">
          {PRESETS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setPreset(opt)}
              className={cn(
                "inline-flex h-7 items-center rounded-full px-3 text-xs transition-[background-color,color,transform] duration-150 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100",
                currentRange === opt
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted/70 text-foreground/70 hover:text-foreground",
              )}
            >
              {opt === "all"
                ? (labels?.all ?? PRESET_LABELS[opt])
                : opt === "180"
                  ? (labels?.halfYear ?? PRESET_LABELS["180"])
                  : opt === "365"
                    ? (labels?.oneYear ?? PRESET_LABELS["365"])
                    : PRESET_LABELS[opt]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className={cn(
              "inline-flex h-7 items-center rounded-full px-3 text-xs transition-[background-color,color,transform] duration-150 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100",
              currentRange === "custom"
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted/70 text-muted-foreground hover:text-foreground",
            )}
          >
            {labels?.custom ?? "Custom"}
          </button>
        </div>
      </Collapse>
    </div>
  );
}
