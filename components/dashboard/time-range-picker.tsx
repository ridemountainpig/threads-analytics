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
}

export default function TimeRangePicker({ locale, labels }: TimeRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasCustom = searchParams.has("from") && searchParams.has("to");
  const currentRange = hasCustom ? "custom" : (searchParams.get("range") ?? "90");

  const [showCustom, setShowCustom] = useState(hasCustom);
  const [fromVal, setFromVal] = useState(searchParams.get("from") ?? "");
  const [toVal, setToVal] = useState(searchParams.get("to") ?? "");
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
    router.push(`${pathname}?${params.toString()}`);
    setShowCustom(false);
  }

  function applyCustom() {
    if (!fromVal || !toVal) return;
    const params = currentParams();
    params.set("from", fromVal);
    params.set("to", toVal);
    params.delete("range");
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
