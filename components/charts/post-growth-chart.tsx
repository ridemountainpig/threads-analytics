"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  activeDot,
  axisTick,
  chartColors,
  compactAxisTick,
  compactChartMargin,
  formatCompactNumber,
  gridProps,
  lineCursor,
} from "./chart-style";
import { ChartAreaGradient, ChartLegend, ChartTooltip, useChartMotion } from "./chart-chrome";
import { formatAge, type AgeLabels } from "@/lib/post-growth";

export interface PostGrowthChartLabels extends AgeLabels {
  thisPost: string;
  typical: string;
  /** e.g. "{age} after publishing" */
  afterPublishing: string;
}

interface PostGrowthChartProps {
  curve: Array<{ ageHours: number; views: number; typical: number | null }>;
  labels: PostGrowthChartLabels;
  dateLocale?: string;
  height?: number;
}

// Ticks at round ages: hours while the post is young, days once it's past three.
function ageTicks(maxHours: number): { ticks: number[]; inDays: boolean } {
  const step = maxHours <= 6 ? 1 : maxHours <= 24 ? 6 : maxHours <= 72 ? 12 : 24;
  const ticks: number[] = [];
  for (let h = 0; h <= maxHours + 1e-9; h += step) ticks.push(h);
  return { ticks, inDays: step === 24 };
}

export default function PostGrowthChart({
  curve,
  labels,
  dateLocale,
  height = 180,
}: PostGrowthChartProps) {
  const locale = dateLocale ?? "en-US";
  const motion = useChartMotion();
  const maxHours = Math.max(1, ...curve.map((p) => p.ageHours));
  const { ticks, inDays } = ageTicks(maxHours);
  const hasTypical = curve.some((p) => p.typical !== null);

  return (
    <>
      <ChartLegend
        className="mb-2"
        items={[
          { label: labels.thisPost, color: chartColors.views, shape: "line" },
          ...(hasTypical
            ? [{ label: labels.typical, color: chartColors.trend, shape: "dash" as const }]
            : []),
        ]}
      />
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={curve} margin={compactChartMargin}>
          <ChartAreaGradient id="post-growth-fill" color={chartColors.views} />
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="ageHours"
            type="number"
            domain={[0, maxHours]}
            ticks={ticks}
            tickFormatter={(h: number) => (inDays ? `${h / 24}d` : `${h}h`)}
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatCompactNumber}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            cursor={lineCursor}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as PostGrowthChartProps["curve"][number];
              return (
                <ChartTooltip
                  title={labels.afterPublishing.replace(
                    "{age}",
                    formatAge(point.ageHours, labels, locale),
                  )}
                  rows={[
                    {
                      label: labels.thisPost,
                      value: point.views.toLocaleString(locale),
                      color: chartColors.views,
                    },
                    ...(point.typical !== null
                      ? [
                          {
                            label: labels.typical,
                            value: point.typical.toLocaleString(locale),
                            color: chartColors.trend,
                          },
                        ]
                      : []),
                  ]}
                />
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke="none"
            fill="url(#post-growth-fill)"
            activeDot={false}
            tooltipType="none"
            {...motion}
          />
          {hasTypical && (
            <Line
              type="monotone"
              dataKey="typical"
              name={labels.typical}
              stroke={chartColors.trend}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={activeDot(chartColors.trend)}
              connectNulls={false}
              {...motion}
            />
          )}
          <Line
            type="monotone"
            dataKey="views"
            name={labels.thisPost}
            stroke={chartColors.views}
            strokeWidth={2}
            dot={false}
            activeDot={activeDot(chartColors.views)}
            {...motion}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
