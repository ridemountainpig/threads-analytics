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
import AxisHint from "./axis-hint";
import {
  axisTick,
  barRadius,
  chartColors,
  compactAxisTick,
  compactChartMargin,
  formatCompactNumber,
  gridProps,
} from "./chart-style";

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
  };
}

function formatHour(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

export default function HourlyBreakdownChart({
  heatmap,
  bestTimeToPost,
  labels,
}: HourlyBreakdownChartProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
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
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setSelectedDay(null)}
          className={`rounded px-2 py-1 text-xs transition-colors ${selectedDay === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          {copy.allDays}
        </button>
        {copy.days.map((label, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            className={`rounded px-2 py-1 text-xs transition-colors ${selectedDay === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="hour"
            tickFormatter={formatHour}
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
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as (typeof chartData)[number] | undefined;
              return (
                <div className="bg-popover border-border rounded border px-2 py-1 text-xs shadow-sm">
                  <p className="font-medium">{formatHour(Number(label ?? 0))}</p>
                  <p>
                    {medianViewsLabel}: {(point?.medianViews ?? 0).toLocaleString()}
                  </p>
                  <p>
                    {copy.avgViewsTooltip}: {(point?.avgViews ?? 0).toLocaleString()}
                  </p>
                  <p>
                    {p75ViewsLabel}: {(point?.p75Views ?? 0).toLocaleString()}
                  </p>
                  <p>
                    {hitRateLabel}: {point?.hitRate ?? 0}%
                  </p>
                  <p className="text-muted-foreground">
                    {copy.postsTooltip}: {point?.postCount ?? 0}
                  </p>
                  <p className="text-muted-foreground">
                    {confidenceLabel}:{" "}
                    {copy.confidenceLevels?.[point?.confidence ?? "low"] ??
                      point?.confidence ??
                      "low"}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="medianViews" fill={chartColors.bar} radius={barRadius} maxBarSize={20}>
            {chartData.map((entry) => (
              <Cell
                key={entry.hour}
                fillOpacity={
                  entry.confidence === "low" ? 0.4 : entry.confidence === "medium" ? 0.7 : 1
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
