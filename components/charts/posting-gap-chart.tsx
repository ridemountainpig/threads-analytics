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
  Legend,
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
  legendStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";

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

export default function PostingGapChart({ data, labels }: PostingGapChartProps) {
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
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
        {copy.noData}
      </div>
    );
  }

  const bucketLabel = (gap: GapBucket) => copy.gapBuckets[gap] ?? gap;

  return (
    <>
      <AxisHint x={copy.gapDays} y={`${copy.medianViews} / ${copy.engagementRate}`} />
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
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as PostingGapChartProps["data"][number];
              return (
                <div
                  style={tooltipStyle}
                  className="border-border bg-popover text-popover-foreground rounded border px-2 py-1 text-xs shadow-sm"
                >
                  <p style={tooltipLabelStyle}>{bucketLabel(point.gap)}</p>
                  <p>
                    {copy.posts}: {point.postCount.toLocaleString()}
                  </p>
                  <p>
                    {copy.medianViews}: {point.medianViews.toLocaleString()}
                  </p>
                  <p>
                    {copy.avgViews}: {point.avgViews.toLocaleString()}
                  </p>
                  <p>
                    {copy.engagementRate}: {point.engagementRate.toFixed(2)}%
                  </p>
                  <p>
                    {copy.hitRate}: {point.hitRate}%
                  </p>
                  <p className="text-muted-foreground">
                    {copy.confidence}:{" "}
                    {copy.confidenceLevels?.[point.confidence] ?? point.confidence}
                  </p>
                </div>
              );
            }}
          />
          <Legend iconSize={10} wrapperStyle={legendStyle} />
          <Bar
            yAxisId="views"
            dataKey="medianViews"
            name={copy.medianViews}
            fill={chartColors.views}
            radius={barRadius}
            maxBarSize={40}
          >
            {data.map((entry) => (
              <Cell
                key={entry.gap}
                fillOpacity={
                  entry.confidence === "low" ? 0.4 : entry.confidence === "medium" ? 0.7 : 1
                }
              />
            ))}
          </Bar>
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="engagementRate"
            name={copy.engagementRate}
            stroke={chartColors.engagement}
            strokeWidth={2}
            dot={{ r: 3, fill: chartColors.engagement }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
