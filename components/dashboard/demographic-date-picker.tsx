"use client";

import { useCallback } from "react";
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

  const apply = useCallback(
    (from: string, to: string) => {
      // Read the live location rather than useSearchParams, which can be empty
      // on first paint, so the tab and time-range params survive the update.
      const params = new URLSearchParams(
        typeof window !== "undefined" && window.location.search.length > 1
          ? window.location.search
          : searchParams.toString(),
      );
      params.set("dFrom", from);
      params.set("dTo", to);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Picking a baseline later than the comparison date (or the reverse) would ask
  // for a backwards window, so the other end is pulled along instead.
  const onBaselineChange = (value: string | null) => {
    if (!value) return;
    apply(value, value > current ? value : current);
  };
  const onCurrentChange = (value: string | null) => {
    if (!value) return;
    apply(value < baseline ? value : baseline, value);
  };

  const labelFor = (value: string) => options.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={baseline} onValueChange={onBaselineChange}>
        <SelectTrigger
          size="sm"
          className="h-8 w-auto max-w-44 min-w-32"
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

      <Select value={current} onValueChange={onCurrentChange}>
        <SelectTrigger
          size="sm"
          className="h-8 w-auto max-w-44 min-w-32"
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
