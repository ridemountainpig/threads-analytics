"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";

export interface DemographicDateOption {
  /** Snapshot date key, YYYY-MM-DD. */
  value: string;
  /** Same date, already formatted in the viewer's locale. */
  label: string;
}

interface DemographicDatePickerProps {
  /** Only dates that actually carry a demographics snapshot. */
  options: DemographicDateOption[];
  baseline: string;
  current: string;
  labels: { baseline: string; current: string };
}

export default function DemographicDatePicker({
  options,
  baseline,
  current,
  labels,
}: DemographicDatePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  // Holds the picked dates while the server renders, instead of snapping back.
  const [selected, setSelected] = useOptimistic({ baseline, current });

  const apply = (from: string, to: string) => {
    // Read the live location rather than useSearchParams, which can be empty
    // on first paint, so the tab and time-range params survive the update.
    const params = new URLSearchParams(
      typeof window !== "undefined" && window.location.search.length > 1
        ? window.location.search
        : searchParams.toString(),
    );
    params.set("dFrom", from);
    params.set("dTo", to);
    startTransition(() => {
      setSelected({ baseline: from, current: to });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  // Picking a baseline later than the comparison date (or the reverse) would ask
  // for a backwards window, so the other end is pulled along instead.
  const onBaselineChange = (value: string | null) => {
    if (!value) return;
    apply(value, value > selected.current ? value : selected.current);
  };
  const onCurrentChange = (value: string | null) => {
    if (!value) return;
    apply(value < selected.baseline ? value : selected.baseline, value);
  };

  const labelFor = (value: string) => options.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={isPending || undefined}>
      <Select value={selected.baseline} onValueChange={onBaselineChange}>
        <SelectTrigger
          size="sm"
          className="bg-muted/70 hover:bg-muted dark:bg-muted/70 dark:hover:bg-muted h-7 w-auto max-w-44 min-w-32 rounded-full border-0 px-3 text-xs tabular-nums data-[size=sm]:rounded-full"
          aria-label={labels.baseline}
        >
          <SelectValue>{(value) => labelFor(String(value))}</SelectValue>
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false} className="max-h-64">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} label={option.label}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ArrowRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden />

      <Select value={selected.current} onValueChange={onCurrentChange}>
        <SelectTrigger
          size="sm"
          className="bg-muted/70 hover:bg-muted dark:bg-muted/70 dark:hover:bg-muted h-7 w-auto max-w-44 min-w-32 rounded-full border-0 px-3 text-xs tabular-nums data-[size=sm]:rounded-full"
          aria-label={labels.current}
        >
          <SelectValue>{(value) => labelFor(String(value))}</SelectValue>
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false} className="max-h-64">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} label={option.label}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
