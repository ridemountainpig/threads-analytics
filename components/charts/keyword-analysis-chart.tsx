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
  compactAxisTick,
  formatCompactNumber,
  gridProps,
  lineCursor,
} from "./chart-style";
import { ChartEmptyState, ChartLegend, ChartTooltip, useChartMotion } from "./chart-chrome";

interface DataPoint {
  word: string;
  postCount: number;
  avgViews: number;
  avgEngagementRate: number;
  avgShareRate: number;
}

interface Props {
  data: DataPoint[];
  labels?: {
    posts: string;
    avgViews: string;
    engagementRate: string;
    shareRate: string;
    noData?: string;
  };
}

export default function KeywordAnalysisChart({ data, labels }: Props) {
  const motion = useChartMotion();
  const copy = labels ?? {
    posts: "Posts",
    avgViews: "Avg Views",
    engagementRate: "Engagement Rate",
    shareRate: "Share Rate",
    noData: "No data",
  };

  if (!data.length) {
    return <ChartEmptyState label={copy.noData} height={220} />;
  }

  return (
    <>
      <AxisHint x={copy.avgViews} y={`${copy.engagementRate} / ${copy.shareRate}`} />
      <ChartLegend
        className="mb-2"
        items={[
          { label: copy.avgViews, color: chartColors.views, shape: "dot" },
          { label: copy.engagementRate, color: chartColors.engagement, shape: "line" },
          { label: copy.shareRate, color: chartColors.share, shape: "line" },
        ]}
      />
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="word"
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={60}
          />
          <YAxis
            yAxisId="views"
            tickFormatter={formatCompactNumber}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={40}
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
                  title={point.word}
                  rows={[
                    {
                      label: copy.avgViews,
                      value: point.avgViews.toLocaleString(),
                      color: chartColors.views,
                    },
                    {
                      label: copy.engagementRate,
                      value: `${point.avgEngagementRate.toFixed(2)}%`,
                      color: chartColors.engagement,
                    },
                    {
                      label: copy.shareRate,
                      value: `${point.avgShareRate.toFixed(2)}%`,
                      color: chartColors.share,
                    },
                    { label: copy.posts, value: point.postCount.toLocaleString(), muted: true },
                  ]}
                />
              );
            }}
          />
          <Bar
            yAxisId="views"
            dataKey="avgViews"
            name={copy.avgViews}
            fill={chartColors.views}
            fillOpacity={0.75}
            radius={barRadius}
            maxBarSize={20}
            {...motion}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="avgEngagementRate"
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
            dataKey="avgShareRate"
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
