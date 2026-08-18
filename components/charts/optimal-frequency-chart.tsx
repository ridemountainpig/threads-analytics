"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AxisHint from "./axis-hint";
import {
  activeDot,
  axisTick,
  barRadius,
  chartColors,
  formatCompactNumber,
  gridProps,
  lineCursor,
} from "./chart-style";
import { ChartEmptyState, ChartLegend, ChartTooltip, useChartMotion } from "./chart-chrome";

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
  const motion = useChartMotion();
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
    return <ChartEmptyState label={copy.noData} height={220} />;
  }

  return (
    <>
      <AxisHint x={copy.postsPerWeek} y={`${copy.avgViewsPost} / ${copy.engagementRate}`} />
      <ChartLegend
        className="mb-2"
        items={[
          { label: copy.avgViewsPost, color: chartColors.views, shape: "dot" },
          { label: copy.engagementRate, color: chartColors.engagement, shape: "line" },
          { label: copy.shareRate, color: chartColors.share, shape: "line" },
        ]}
      />
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
            cursor={lineCursor}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as DataPoint;
              return (
                <ChartTooltip
                  title={`${point.range} ${copy.postsPerWeek}`}
                  subtitle={`${point.weekCount} ${copy.weeks}`}
                  rows={[
                    {
                      label: copy.avgViewsPost,
                      value: point.avgViewsPerPost.toLocaleString(),
                      color: chartColors.views,
                    },
                    {
                      label: copy.engagementRate,
                      value: `${point.engagementRate.toFixed(2)}%`,
                      color: chartColors.engagement,
                    },
                    {
                      label: copy.shareRate,
                      value: `${point.shareRate.toFixed(2)}%`,
                      color: chartColors.share,
                    },
                  ]}
                />
              );
            }}
          />
          <Bar
            yAxisId="views"
            dataKey="avgViewsPerPost"
            name={copy.avgViewsPost}
            fill={chartColors.views}
            fillOpacity={0.75}
            radius={barRadius}
            maxBarSize={28}
            {...motion}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="engagementRate"
            name={copy.engagementRate}
            stroke={chartColors.engagement}
            strokeWidth={1.5}
            dot={false}
            activeDot={activeDot(chartColors.engagement)}
            {...motion}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="shareRate"
            name={copy.shareRate}
            stroke={chartColors.share}
            strokeWidth={1.5}
            dot={false}
            activeDot={activeDot(chartColors.share)}
            {...motion}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
