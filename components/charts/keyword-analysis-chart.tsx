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
  Cell,
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
  const copy = labels ?? {
    posts: "Posts",
    avgViews: "Avg Views",
    engagementRate: "Engagement Rate",
    shareRate: "Share Rate",
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
      <AxisHint x={copy.avgViews} y={`${copy.engagementRate} / ${copy.shareRate}`} />
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
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as DataPoint;
              return (
                <div
                  style={tooltipStyle}
                  className="border-border bg-popover text-popover-foreground rounded border px-2 py-1 text-xs shadow-sm"
                >
                  <p style={tooltipLabelStyle}>{point.word}</p>
                  <p>
                    {copy.posts}: {point.postCount}
                  </p>
                  <p>
                    {copy.avgViews}: {point.avgViews.toLocaleString()}
                  </p>
                  <p>
                    {copy.engagementRate}: {point.avgEngagementRate.toFixed(2)}%
                  </p>
                  <p>
                    {copy.shareRate}: {point.avgShareRate.toFixed(2)}%
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
            dataKey="avgViews"
            name={copy.avgViews}
            fill={chartColors.bar}
            radius={barRadius}
            maxBarSize={22}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="avgEngagementRate"
            name={copy.engagementRate}
            stroke={chartColors.engagement}
            strokeWidth={1.5}
            dot={{ r: 2 }}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="avgShareRate"
            name={copy.shareRate}
            stroke={chartColors.share}
            strokeWidth={1.5}
            dot={{ r: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
