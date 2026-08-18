"use client";

import { useMemo, useState, useTransition } from "react";
import { updateSyncIntervalAction } from "@/actions/settings";
import { Collapse } from "@/components/ui/collapse";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PRESET_VALUES = ["0", "60", "360", "1440"] as const;
const CUSTOM_VALUE = "custom";

const OPTIONS: { value: string; label: string }[] = [
  { value: "0", label: "Manual only" },
  { value: "60", label: "Every hour" },
  { value: "360", label: "Every 6 hours" },
  { value: "1440", label: "Daily" },
];

interface Props {
  currentInterval: string;
  labels?: {
    intervals: Record<string, string>;
    intervalUpdated: string;
    invalidInterval: string;
    manualHelp: string;
    autoHelp: string;
    customInterval: string;
    minutes: string;
    apply: string;
  };
}

export default function SyncIntervalSetting({ currentInterval, labels }: Props) {
  const [pending, startTransition] = useTransition();
  const isPreset = PRESET_VALUES.includes(currentInterval as (typeof PRESET_VALUES)[number]);
  const [selected, setSelected] = useState(isPreset ? currentInterval : CUSTOM_VALUE);
  const [customMinutes, setCustomMinutes] = useState(isPreset ? "15" : currentInterval);
  const [savedInterval, setSavedInterval] = useState(currentInterval);

  const copy = labels ?? {
    intervals: Object.fromEntries(OPTIONS.map((opt) => [opt.value, opt.label])),
    intervalUpdated: "Sync interval updated",
    invalidInterval: "Enter a whole number from 1 to 10080 minutes",
    manualHelp: "Sync only when you click the Sync button",
    autoHelp: "Server sync runs when more than {interval} has elapsed",
    customInterval: "Custom",
    minutes: "minutes",
    apply: "Apply",
  };

  const intervalLabel = useMemo(() => {
    if (savedInterval === "0") return "";
    return copy.intervals[savedInterval] ?? `${savedInterval} ${copy.minutes}`;
  }, [copy.intervals, copy.minutes, savedInterval]);

  function saveInterval(value: string) {
    if (!value) return;
    const normalized = value.trim();
    if (!/^\d+$/.test(normalized)) {
      toast.error(copy.invalidInterval);
      return;
    }

    const minutes = Number.parseInt(normalized, 10);
    if (!Number.isSafeInteger(minutes) || (minutes !== 0 && (minutes < 1 || minutes > 10080))) {
      toast.error(copy.invalidInterval);
      return;
    }

    startTransition(async () => {
      const result = await updateSyncIntervalAction(String(minutes));
      if (result.error) {
        toast.error(result.error);
      } else {
        setSavedInterval(String(minutes));
        toast.success(copy.intervalUpdated);
      }
    });
  }

  function handleSelect(value: string | null) {
    if (!value) return;
    setSelected(value);
    if (value !== CUSTOM_VALUE) saveInterval(value);
  }

  // Presets laid out as capsule chips — every choice visible at a glance,
  // matching the filter-chip grammar used across the dashboard.
  // Spacing for the custom row lives inside the Collapse (pt-3 on its
  // content), so the gap grows and shrinks with the row instead of jumping
  // when the row unmounts.
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {[...OPTIONS.map((opt) => opt.value), CUSTOM_VALUE].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleSelect(value)}
            disabled={pending}
            className={cn(
              "inline-flex h-7 items-center rounded-full px-3 text-xs transition-[background-color,color,transform] duration-150 active:scale-[0.96] disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100",
              selected === value
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted/70 text-foreground/70 hover:text-foreground",
            )}
          >
            {value === CUSTOM_VALUE ? copy.customInterval : (copy.intervals[value] ?? value)}
          </button>
        ))}
      </div>

      {/* Custom minutes: the same recessed-capsule field + filled Apply pair
          as the time-range picker's custom dates, so "type a value, apply it"
          looks identical everywhere. */}
      <Collapse open={selected === CUSTOM_VALUE}>
        <div className="flex max-w-xs items-center gap-2 pt-3 pb-0.5">
          <div className="relative min-w-0 flex-1">
            <input
              type="number"
              min={1}
              max={10080}
              step={1}
              inputMode="numeric"
              value={customMinutes}
              onChange={(event) => setCustomMinutes(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") saveInterval(customMinutes);
              }}
              disabled={pending}
              aria-label={copy.customInterval}
              className="bg-muted/70 focus-visible:ring-ring/40 h-7 w-full [appearance:textfield] rounded-full py-1 pr-16 pl-3 text-xs tabular-nums transition-[background-color,box-shadow] duration-150 outline-none focus-visible:ring-2 disabled:opacity-60 motion-reduce:transition-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
              {copy.minutes}
            </span>
          </div>
          <button
            type="button"
            onClick={() => saveInterval(customMinutes)}
            disabled={pending}
            className="bg-primary text-primary-foreground h-7 shrink-0 rounded-full px-3 text-xs font-medium transition-[background-color,transform] duration-150 active:scale-[0.96] disabled:opacity-60 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {copy.apply}
          </button>
        </div>
      </Collapse>

      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        {savedInterval === "0"
          ? copy.manualHelp
          : copy.autoHelp.replace("{interval}", intervalLabel.toLowerCase())}
      </p>
    </div>
  );
}
