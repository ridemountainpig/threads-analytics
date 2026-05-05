"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import AxisHint from "./axis-hint";
import {
  axisTick,
  barRadius,
  chartColors,
  compactAxisTick,
  formatCompactNumber,
  gridProps,
  legendStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";

interface DataPoint {
  range: string;
  postCount: number;
  weekCount: number;
  avgViewsPerPost: number;
  engagementRate: number;
  shareRate: number;
}

interface Props {
  data: DataPoint[];
  labels?: {
    range: string;
    postsPerWeek: string;
    avgViewsPost: string;
    engagementRate: string;
    shareRate: string;
    weeks: string;
    noData?: string;
  };
}

export default function OptimalFrequencyChart({ data, labels }: Props) {
  const copy = labels ?? {
    range: "Posts/Week",
    postsPerWeek: "Posts / Week",
    avgViewsPost: "Avg Views / Post",
    engagementRate: "Engagement Rate",
    shareRate: "Share Rate",
    weeks: "weeks",
    noData: "No data",
  };

  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
        {copy.noData}
      </div>
    );
  }

  return (
    <>
      <AxisHint x={copy.postsPerWeek} y={`${copy.avgViewsPost} / ${copy.engagementRate}`} />
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="range" tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="views"
            tickFormatter={formatCompactNumber}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={42}
          />
          <YAxis
            yAxisId="rate"
            orientation="right"
            tickFormatter={(v: number) => `${v}%`}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={38}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as DataPoint;
              return (
                <div
                  style={tooltipStyle}
                  className="border-border bg-popover text-popover-foreground rounded border px-2 py-1 text-xs shadow-sm"
                >
                  <p style={tooltipLabelStyle}>
                    {point.range} {copy.postsPerWeek}
                  </p>
                  <p>
                    {copy.weeks}: {point.weekCount}
                  </p>
                  <p>
                    {copy.avgViewsPost}: {point.avgViewsPerPost.toLocaleString()}
                  </p>
                  <p>
                    {copy.engagementRate}: {point.engagementRate.toFixed(2)}%
                  </p>
                  <p>
                    {copy.shareRate}: {point.shareRate.toFixed(2)}%
                  </p>
                </div>
              );
            }}
            contentStyle={tooltipStyle}
            itemStyle={tooltipLabelStyle}
            labelStyle={tooltipLabelStyle}
          />
          <Legend iconType="square" iconSize={10} wrapperStyle={legendStyle} />
          <Bar
            yAxisId="views"
            dataKey="avgViewsPerPost"
            name={copy.avgViewsPost}
            fill={chartColors.bar}
            radius={barRadius}
            maxBarSize={28}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="engagementRate"
            name={copy.engagementRate}
            stroke={chartColors.engagement}
            strokeWidth={1.5}
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="shareRate"
            name={copy.shareRate}
            stroke={chartColors.share}
            strokeWidth={1.5}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
