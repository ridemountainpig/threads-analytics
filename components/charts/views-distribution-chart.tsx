"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
import { ChartEmptyState, ChartTooltip, useChartMotion } from "./chart-chrome";

interface ViewsDistributionChartProps {
  data: {
    totalPosts: number;
    buckets: Array<{ bucket: string; count: number; percentage: number }>;
    milestones: Array<{ threshold: number; count: number; percentage: number }>;
  };
  numberLocale?: string;
  labels?: {
    views: string;
    posts: string;
    viewRange: string;
    ofPosts: string;
    noData: string;
  };
}

export default function ViewsDistributionChart({
  data,
  numberLocale,
  labels,
}: ViewsDistributionChartProps) {
  const locale = numberLocale ?? "en-US";
  const motion = useChartMotion();
  const copy = labels ?? {
    views: "Views",
    posts: "Posts",
    viewRange: "View Range",
    ofPosts: "of posts",
    noData: "No data",
  };

  if (data.totalPosts === 0) {
    return <ChartEmptyState label={copy.noData} height={192} />;
  }

  return (
    <>
      {/* Milestone tiles: the headline share leads, context sits beneath. */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {data.milestones.map((milestone) => (
          <div key={milestone.threshold} className="bg-muted/40 rounded-xl px-3 py-2.5">
            <p className="text-muted-foreground text-[11px] leading-4 tracking-[0.01em]">
              ≥ {formatCompactNumber(milestone.threshold)} {copy.views}
            </p>
            <p className="mt-0.5 text-xl leading-6 font-semibold tracking-[-0.01em] tabular-nums">
              {milestone.percentage}%
            </p>
            <p className="text-muted-foreground/80 mt-0.5 text-[11px] leading-4 tabular-nums">
              {milestone.count.toLocaleString(locale)} / {data.totalPosts.toLocaleString(locale)}
            </p>
          </div>
        ))}
      </div>
      <AxisHint x={copy.viewRange} y={copy.posts} />
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data.buckets} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="bucket"
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={30}
            allowDecimals={false}
          />
          <Tooltip
            cursor={barCursor}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]
                ?.payload as ViewsDistributionChartProps["data"]["buckets"][number];
              return (
                <ChartTooltip
                  title={`${String(label)} ${copy.views}`}
                  rows={[
                    {
                      label: copy.posts,
                      value: point.count.toLocaleString(locale),
                      color: chartColors.views,
                    },
                    {
                      label: copy.ofPosts,
                      value: `${point.percentage}%`,
                      muted: true,
                    },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="count"
            fill={chartColors.views}
            fillOpacity={0.78}
            radius={barRadius}
            maxBarSize={28}
            {...motion}
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
