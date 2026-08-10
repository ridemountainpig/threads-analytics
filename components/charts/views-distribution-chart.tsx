"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AxisHint from "./axis-hint";
import {
  axisTick,
  barRadius,
  chartColors,
  compactAxisTick,
  compactChartMargin,
  formatCompactNumber,
  gridProps,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";

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
  const copy = labels ?? {
    views: "Views",
    posts: "Posts",
    viewRange: "View Range",
    ofPosts: "of posts",
    noData: "No data",
  };

  if (data.totalPosts === 0) {
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
        {copy.noData}
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {data.milestones.map((milestone) => (
          <div key={milestone.threshold} className="bg-muted/40 rounded-md px-3 py-2">
            <p className="text-muted-foreground text-xs">
              ≥ {formatCompactNumber(milestone.threshold)} {copy.views}
            </p>
            <p className="text-lg font-semibold tabular-nums">{milestone.percentage}%</p>
            <p className="text-muted-foreground text-xs">
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
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]
                ?.payload as ViewsDistributionChartProps["data"]["buckets"][number];
              return (
                <div
                  style={tooltipStyle}
                  className="border-border bg-popover text-popover-foreground rounded border px-2 py-1 text-xs shadow-sm"
                >
                  <p style={tooltipLabelStyle}>
                    {String(label)} {copy.views}
                  </p>
                  <p>
                    {copy.posts}: {point.count.toLocaleString(locale)} ({point.percentage}%{" "}
                    {copy.ofPosts})
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" fill={chartColors.views} radius={barRadius} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
