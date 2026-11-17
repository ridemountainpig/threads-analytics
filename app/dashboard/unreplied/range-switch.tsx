"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/charts/segmented-control";
import { cn } from "@/lib/utils";

export default function RangeSwitch({
  value,
  options,
  label,
}: {
  value: number;
  options: Array<{ value: string; label: string }>;
  label: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const onChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("range", next);
    startTransition(() => router.replace(`${pathname}?${params}`, { scroll: false }));
  };

  return (
    <SegmentedControl
      value={String(value)}
      onChange={onChange}
      options={options}
      label={label}
      className={cn("shrink-0 tabular-nums", pending && "opacity-60")}
    />
  );
}
