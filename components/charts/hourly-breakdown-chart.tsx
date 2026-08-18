"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import AxisHint from "./axis-hint";
import {
  axisTick,
  barCursor,
  barRadius,
  chartColors,
  compactAxisTick,
  compactChartMargin,
  formatCompactNumber,
  gridProps,
} from "./chart-style";
import { ChartTooltip, useChartMotion } from "./chart-chrome";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface HourlyBreakdownChartProps {
  heatmap: Array<{
    dayOfWeek: number;
    hour: number;
    avgViews: number;
    medianViews: number;
    p75Views: number;
    hitRate: number;
    confidence: "low" | "medium" | "high";
    postCount: number;
  }>;
  bestTimeToPost: Array<{
    hour: number;
    avgViews: number;
    medianViews: number;
    p75Views: number;
    hitRate: number;
    confidence: "low" | "medium" | "high";
    avgLikes: number;
    postCount: number;
  }>;
  dateLocale?: string;
  labels?: {
    allDays: string;
    days: readonly string[];
    avgViewsTooltip: string;
    postsTooltip: string;
    hour?: string;
    medianViews?: string;
    p75Views?: string;
    hitRate?: string;
    confidence?: string;
    confidenceLevels?: Record<"low" | "medium" | "high", string>;
    noData?: string;
  };
}

function formatHour(h: number, locale?: string) {
  try {
    return new Intl.DateTimeFormat(locale ?? "en-US", { hour: "numeric", hourCycle: "h23" }).format(
      new Date(2000, 0, 1, h),
    );
  } catch {
    if (h === 0) return "12 AM";
    if (h < 12) return `${h} AM`;
    if (h === 12) return "12 PM";
    return `${h - 12} PM`;
  }
}

const CONFIDENCE_OPACITY: Record<"low" | "medium" | "high", number> = {
  low: 0.35,
  medium: 0.65,
  high: 1,
};

// Filter chips share one visual grammar: capsule, filled when selected,
// pressed-state scale for instant feedback.
function DayChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[11px] transition-[background-color,color,transform] duration-150 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100",
        selected
          ? "bg-primary text-primary-foreground font-medium"
          : "bg-muted/70 text-foreground/70 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export default function HourlyBreakdownChart({
  heatmap,
  bestTimeToPost,
  dateLocale,
  labels,
}: HourlyBreakdownChartProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const motion = useChartMotion();
  const copy = labels ?? {
    allDays: "All days",
    days: DAY_LABELS,
    avgViewsTooltip: "Avg Views",
    postsTooltip: "Posts",
    medianViews: "Median Views",
    p75Views: "P75 Views",
    hitRate: "Hit Rate",
    confidence: "Confidence",
  };
  const medianViewsLabel = copy.medianViews ?? "Median Views";
  const p75ViewsLabel = copy.p75Views ?? "P75 Views";
  const hitRateLabel = copy.hitRate ?? "Hit Rate";
  const confidenceLabel = copy.confidence ?? "Confidence";

  const chartData = useMemo(() => {
    if (selectedDay === null) {
      const byHour = new Map(bestTimeToPost.map((entry) => [entry.hour, entry]));
      return Array.from({ length: 24 }, (_, h) => {
        const entry = byHour.get(h);
        return {
          hour: h,
          avgViews: entry?.avgViews ?? 0,
          medianViews: entry?.medianViews ?? 0,
          p75Views: entry?.p75Views ?? 0,
          hitRate: entry?.hitRate ?? 0,
          confidence: entry?.confidence ?? "low",
          postCount: entry?.postCount ?? 0,
        };
      });
    }

    const byHour = new Map(
      heatmap
        .filter((entry) => entry.dayOfWeek === selectedDay)
        .map((entry) => [entry.hour, entry]),
    );
    return Array.from({ length: 24 }, (_, h) => {
      const entry = byHour.get(h);
      return {
        hour: h,
        avgViews: entry?.avgViews ?? 0,
        medianViews: entry?.medianViews ?? 0,
        p75Views: entry?.p75Views ?? 0,
        hitRate: entry?.hitRate ?? 0,
        confidence: entry?.confidence ?? "low",
        postCount: entry?.postCount ?? 0,
      };
    });
  }, [bestTimeToPost, heatmap, selectedDay]);

  return (
    <div className="space-y-3">
      <AxisHint x={copy.hour ?? "Hour"} y={medianViewsLabel} />
      <div className="flex flex-wrap gap-1.5">
        <DayChip selected={selectedDay === null} onClick={() => setSelectedDay(null)}>
          {copy.allDays}
        </DayChip>
        {copy.days.map((label, i) => (
          <DayChip key={i} selected={selectedDay === i} onClick={() => setSelectedDay(i)}>
            {label}
          </DayChip>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="hour"
            tickFormatter={(h: number) => formatHour(h, dateLocale)}
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
            interval={2}
          />
          <YAxis
            tickFormatter={formatCompactNumber}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            cursor={barCursor}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as (typeof chartData)[number] | undefined;
              return (
                <ChartTooltip
                  title={formatHour(Number(label ?? 0), dateLocale)}
                  subtitle={`${confidenceLabel}: ${
                    copy.confidenceLevels?.[point?.confidence ?? "low"] ??
                    point?.confidence ??
                    "low"
                  }`}
                  rows={[
                    {
                      label: medianViewsLabel,
                      value: (point?.medianViews ?? 0).toLocaleString(),
                      color: chartColors.views,
                    },
                    { label: copy.avgViewsTooltip, value: (point?.avgViews ?? 0).toLocaleString() },
                    { label: p75ViewsLabel, value: (point?.p75Views ?? 0).toLocaleString() },
                    { label: hitRateLabel, value: `${point?.hitRate ?? 0}%` },
                    {
                      label: copy.postsTooltip,
                      value: (point?.postCount ?? 0).toLocaleString(),
                      muted: true,
                    },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="medianViews"
            fill={chartColors.views}
            radius={barRadius}
            maxBarSize={18}
            {...motion}
          >
            {chartData.map((entry) => (
              <Cell key={entry.hour} fillOpacity={CONFIDENCE_OPACITY[entry.confidence]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
