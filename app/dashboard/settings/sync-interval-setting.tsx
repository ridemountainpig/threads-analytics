"use client";

import { useMemo, useState, useTransition } from "react";
import { updateSyncIntervalAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  return (
    <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[240px_minmax(0,1fr)]">
      <div>
        <Select value={selected} onValueChange={handleSelect} disabled={pending}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue>
              {(value) =>
                value === CUSTOM_VALUE ? copy.customInterval : (copy.intervals[value] ?? value)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            {OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} label={copy.intervals[opt.value]}>
                {copy.intervals[opt.value]}
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_VALUE} label={copy.customInterval}>
              {copy.customInterval}
            </SelectItem>
          </SelectContent>
        </Select>

        {selected === CUSTOM_VALUE && (
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Input
                type="number"
                min={1}
                max={10080}
                step={1}
                inputMode="numeric"
                value={customMinutes}
                onChange={(event) => setCustomMinutes(event.target.value)}
                disabled={pending}
                className="h-9 pr-20"
              />
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                {copy.minutes}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => saveInterval(customMinutes)}
              disabled={pending}
            >
              {copy.apply}
            </Button>
          </div>
        )}
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed">
        {savedInterval === "0"
          ? copy.manualHelp
          : copy.autoHelp.replace("{interval}", intervalLabel.toLowerCase())}
      </p>
    </div>
  );
}
