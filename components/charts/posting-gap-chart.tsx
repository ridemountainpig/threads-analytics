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

type GapBucket = "0" | "1" | "2-3" | "4-7" | "8+";

interface PostingGapChartProps {
  data: Array<{
    gap: GapBucket;
    postCount: number;
    medianViews: number;
    avgViews: number;
    engagementRate: number;
    hitRate: number;
    confidence: "low" | "medium" | "high";
  }>;
  labels?: {
    gapDays: string;
    gapBuckets: Record<GapBucket, string>;
    posts: string;
    medianViews: string;
    avgViews: string;
    engagementRate: string;
    hitRate: string;
    confidence: string;
    confidenceLevels?: Record<"low" | "medium" | "high", string>;
    noData: string;
  };
}

const DEFAULT_BUCKET_LABELS: Record<GapBucket, string> = {
  "0": "Same day",
  "1": "Next day",
  "2-3": "2-3 days",
  "4-7": "4-7 days",
  "8+": "8+ days",
};

const CONFIDENCE_OPACITY: Record<"low" | "medium" | "high", number> = {
  low: 0.35,
  medium: 0.65,
  high: 1,
};

export default function PostingGapChart({ data, labels }: PostingGapChartProps) {
  const motion = useChartMotion();
  const copy = labels ?? {
    gapDays: "Days Since Last Post",
    gapBuckets: DEFAULT_BUCKET_LABELS,
    posts: "Posts",
    medianViews: "Median Views",
    avgViews: "Avg Views",
    engagementRate: "Engagement Rate",
    hitRate: "Hit Rate",
    confidence: "Confidence",
    noData: "No data",
  };

  if (!data.length) {
    return <ChartEmptyState label={copy.noData} height={240} />;
  }

  const bucketLabel = (gap: GapBucket) => copy.gapBuckets[gap] ?? gap;

  return (
    <>
      <AxisHint x={copy.gapDays} y={`${copy.medianViews} / ${copy.engagementRate}`} />
      <ChartLegend
        className="mb-2"
        items={[
          { label: copy.medianViews, color: chartColors.views, shape: "dot" },
          { label: copy.engagementRate, color: chartColors.engagement, shape: "line" },
        ]}
      />
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="gap"
            tickFormatter={(value) => bucketLabel(value as GapBucket)}
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            yAxisId="views"
            tickFormatter={formatCompactNumber}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={44}
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
              const point = payload[0]?.payload as PostingGapChartProps["data"][number];
              return (
                <ChartTooltip
                  title={bucketLabel(point.gap)}
                  subtitle={`${copy.confidence}: ${
                    copy.confidenceLevels?.[point.confidence] ?? point.confidence
                  }`}
                  rows={[
                    {
                      label: copy.medianViews,
                      value: point.medianViews.toLocaleString(),
                      color: chartColors.views,
                    },
                    { label: copy.avgViews, value: point.avgViews.toLocaleString() },
                    {
                      label: copy.engagementRate,
                      value: `${point.engagementRate.toFixed(2)}%`,
                      color: chartColors.engagement,
                    },
                    { label: copy.hitRate, value: `${point.hitRate}%` },
                    { label: copy.posts, value: point.postCount.toLocaleString(), muted: true },
                  ]}
                />
              );
            }}
          />
          <Bar
            yAxisId="views"
            dataKey="medianViews"
            name={copy.medianViews}
            fill={chartColors.views}
            radius={barRadius}
            maxBarSize={36}
            {...motion}
          >
            {data.map((entry) => (
              <Cell key={entry.gap} fillOpacity={CONFIDENCE_OPACITY[entry.confidence]} />
            ))}
          </Bar>
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="engagementRate"
            name={copy.engagementRate}
            stroke={chartColors.engagement}
            strokeWidth={1.8}
            dot={{ r: 2.5, fill: chartColors.engagement, strokeWidth: 0 }}
            activeDot={activeDot(chartColors.engagement)}
            {...motion}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
