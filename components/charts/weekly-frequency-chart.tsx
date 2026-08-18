"use client";

import {
  ComposedChart,
  Bar,
  Cell,
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
  compactChartMargin,
  formatCompactNumber,
  gridProps,
  lineCursor,
} from "./chart-style";
import { ChartEmptyState, ChartLegend, ChartTooltip, useChartMotion } from "./chart-chrome";

interface WeeklyFrequencyChartProps {
  data: Array<{
    week: string;
    postCount: number;
    avgViews: number;
    medianViews: number;
    engagementRate: number;
    shareRate: number;
    hitRate: number;
    confidence: "low" | "medium" | "high";
  }>;
  labels?: {
    posts: string;
    avgViews: string;
    week?: string;
    medianViews?: string;
    hitRate?: string;
    confidence?: string;
    confidenceLevels?: Record<"low" | "medium" | "high", string>;
    engagementRate: string;
    shareRate: string;
    noData?: string;
  };
}

function formatWeek(week: string) {
  return week.replace(/^\d{4}-/, "");
}

const CONFIDENCE_OPACITY: Record<"low" | "medium" | "high", number> = {
  low: 0.4,
  medium: 0.7,
  high: 1,
};

export default function WeeklyFrequencyChart({ data, labels }: WeeklyFrequencyChartProps) {
  const motion = useChartMotion();
  const copy = labels ?? {
    posts: "Posts",
    avgViews: "Avg Views",
    medianViews: "Median Views",
    hitRate: "Hit Rate",
    confidence: "Confidence",
    engagementRate: "Engagement Rate",
    shareRate: "Share Rate",
    noData: "No data",
  };
  const medianViewsLabel = copy.medianViews ?? "Median Views";
  const hitRateLabel = copy.hitRate ?? "Hit Rate";
  const confidenceLabel = copy.confidence ?? "Confidence";

  if (!data.length) {
    return <ChartEmptyState label={copy.noData} height={240} />;
  }

  return (
    <>
      <AxisHint
        x={copy.week ?? "Week"}
        y={`${medianViewsLabel} / ${copy.engagementRate} / ${copy.shareRate} / ${copy.posts}`}
      />
      <ChartLegend
        className="mb-2"
        items={[
          { label: medianViewsLabel, color: chartColors.views, shape: "line" },
          { label: copy.engagementRate, color: chartColors.engagement, shape: "line" },
          { label: copy.shareRate, color: chartColors.share, shape: "line" },
          { label: copy.posts, color: chartColors.bar, shape: "dot" },
        ]}
      />
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="week"
            tickFormatter={formatWeek}
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="views"
            tickFormatter={formatCompactNumber}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <YAxis yAxisId="posts" hide domain={[0, "dataMax + 1"]} />
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
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as WeeklyFrequencyChartProps["data"][number];
              return (
                <ChartTooltip
                  title={formatWeek(String(label))}
                  subtitle={`${confidenceLabel}: ${copy.confidenceLevels?.[point.confidence] ?? point.confidence}`}
                  rows={[
                    {
                      label: medianViewsLabel,
                      value: point.medianViews.toLocaleString(),
                      color: chartColors.views,
                    },
                    { label: copy.avgViews, value: point.avgViews.toLocaleString() },
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
                    { label: hitRateLabel, value: `${point.hitRate}%` },
                    { label: copy.posts, value: point.postCount.toLocaleString(), muted: true },
                  ]}
                />
              );
            }}
          />
          <Bar
            yAxisId="posts"
            dataKey="postCount"
            name={copy.posts}
            fill={chartColors.bar}
            radius={barRadius}
            maxBarSize={16}
            {...motion}
          >
            {data.map((entry) => (
              <Cell key={entry.week} fillOpacity={CONFIDENCE_OPACITY[entry.confidence]} />
            ))}
          </Bar>
          <Line
            yAxisId="views"
            type="monotone"
            dataKey="medianViews"
            name={medianViewsLabel}
            stroke={chartColors.views}
            strokeWidth={2}
            dot={false}
            activeDot={activeDot(chartColors.views)}
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
