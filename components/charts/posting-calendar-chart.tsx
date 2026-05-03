"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import AxisHint from "./axis-hint";
import { expandPostingCalendarSeries } from "@/lib/posting-calendar-expand";

interface DataPoint {
  date: string;
  count: number;
}

interface Props {
  data: DataPoint[];
  dateLocale?: string;
  selectedYear: string;
  labels?: {
    less: string;
    more: string;
    days: readonly string[];
    date?: string;
    weekday?: string;
    posts?: string;
    noData?: string;
  };
}

function getIntensity(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  return Math.ceil((count / max) * 4);
}

const INTENSITY_CLASSES: Record<number, string> = {
  0: "bg-muted",
  1: "bg-primary/20",
  2: "bg-primary/45",
  3: "bg-primary/70",
  4: "bg-primary",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function weekdaySunday0FromYmd(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function utcNoonFromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export default function PostingCalendarChart({ data, dateLocale, selectedYear, labels }: Props) {
  const [tooltip, setTooltip] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);
  const copy = labels ?? {
    less: "Less",
    more: "More",
    days: DAY_LABELS,
    noData: "No data",
  };

  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-[120px] items-center justify-center text-sm">
        {copy.noData ?? "No data"}
      </div>
    );
  }

  const calendarData = expandPostingCalendarSeries(data, selectedYear);
  if (!calendarData.length) {
    return (
      <div className="text-muted-foreground flex h-[120px] items-center justify-center text-sm">
        {copy.noData ?? "No data"}
      </div>
    );
  }

  const max = Math.max(...calendarData.map((d) => d.count));
  const startPad = weekdaySunday0FromYmd(calendarData[0].date);
  const paddedData: (DataPoint | null)[] = [...Array(startPad).fill(null), ...calendarData];
  const remainder = paddedData.length % 7;
  if (remainder !== 0) paddedData.push(...Array(7 - remainder).fill(null));

  const weeks: (DataPoint | null)[][] = [];
  for (let i = 0; i < paddedData.length; i += 7) weeks.push(paddedData.slice(i, i + 7));

  const monthLabels: { weekIndex: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstCell = week.find((c) => c !== null);
    if (!firstCell) return;
    const d = utcNoonFromYmd(firstCell.date);
    const m = d.getUTCMonth();
    if (m !== lastMonth) {
      monthLabels.push({
        weekIndex: wi,
        label: d.toLocaleDateString(dateLocale, { month: "short", timeZone: "UTC" }),
      });
      lastMonth = m;
    }
  });

  const gridTemplateColumns = `28px repeat(${weeks.length}, minmax(10px, 1fr))`;

  return (
    <div className="relative w-full pb-1 select-none">
      <AxisHint
        columns={copy.date ?? "Date"}
        rows={copy.weekday ?? "Weekday"}
        color={copy.posts ?? "Posts"}
      />

      <div className="mb-1 grid gap-[2px]" style={{ gridTemplateColumns }}>
        <div />
        {weeks.map((_, wi) => {
          const label = monthLabels.find((m) => m.weekIndex === wi);
          return (
            <div key={wi} className="min-w-0 text-center">
              {label && <span className="text-muted-foreground text-[9px]">{label.label}</span>}
            </div>
          );
        })}
      </div>

      <div className="grid gap-[2px]" style={{ gridTemplateColumns }}>
        <div className="flex flex-col gap-[2px]">
          {copy.days.map((d, i) => (
            <div
              key={d}
              className="text-muted-foreground flex h-[12px] items-center justify-end pr-1 text-[9px]"
            >
              {i % 2 === 1 ? d.slice(0, 1) : ""}
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="flex min-w-0 flex-col gap-[2px]">
            {week.map((cell, di) => {
              if (!cell) return <div key={di} className="h-[12px] w-full rounded-[2px]" />;
              const intensity = getIntensity(cell.count, max);
              return (
                <div
                  key={di}
                  className={cn(
                    "h-[12px] w-full min-w-[8px] cursor-pointer rounded-[2px] transition-opacity hover:opacity-80",
                    INTENSITY_CLASSES[intensity],
                  )}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ ...cell, x: rect.left + rect.width / 2, y: rect.top });
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ ...cell, x: rect.left + rect.width / 2, y: rect.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {tooltip && (
        <div
          className="bg-popover border-border pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-2 rounded border px-2 py-1 text-[11px] shadow-sm"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {utcNoonFromYmd(tooltip.date).toLocaleDateString(dateLocale, { timeZone: "UTC" })} -{" "}
          {tooltip.count} {copy.posts ?? "Posts"}
        </div>
      )}

      <div className="mt-2 flex items-center justify-end gap-1">
        <span className="text-muted-foreground text-[9px]">{copy.less}</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("size-[10px] rounded-[2px]", INTENSITY_CLASSES[i])} />
        ))}
        <span className="text-muted-foreground text-[9px]">{copy.more}</span>
      </div>
    </div>
  );
}
