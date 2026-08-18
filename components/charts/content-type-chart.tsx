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
  Cell,
} from "recharts";
import AxisHint from "./axis-hint";
import {
  activeDot,
  axisTick,
  barRadius,
  chartColors,
  compactChartMargin,
  formatCompactNumber,
  gridProps,
  lineCursor,
} from "./chart-style";
import { ChartEmptyState, ChartLegend, ChartTooltip, useChartMotion } from "./chart-chrome";

interface ContentTypeChartProps {
  data: Array<{
    type: string;
    avgViews: number;
    medianViews: number;
    p75Views: number;
    hitRate: number;
    confidence: "low" | "medium" | "high";
    avgLikes: number;
    postCount: number;
    engagementRate: number;
    replyRate: number;
    shareRate: number;
  }>;
  labels?: {
    avgViews: string;
    posts?: string;
    medianViews?: string;
    p75Views?: string;
    hitRate?: string;
    confidence?: string;
    confidenceLevels?: Record<"low" | "medium" | "high", string>;
    contentType?: string;
    engagementRate: string;
    shareRate: string;
    mediaTypes?: Record<string, string>;
    noData?: string;
  };
}

const CONFIDENCE_OPACITY: Record<"low" | "medium" | "high", number> = {
  low: 0.35,
  medium: 0.65,
  high: 1,
};

export default function ContentTypeChart({ data, labels }: ContentTypeChartProps) {
  const motion = useChartMotion();
  const copy = labels ?? {
    avgViews: "Avg Views",
    posts: "posts",
    medianViews: "Median Views",
    p75Views: "P75 Views",
    hitRate: "Hit Rate",
    confidence: "Confidence",
    engagementRate: "Engagement Rate",
    shareRate: "Share Rate",
    noData: "No data",
  };
  const medianViewsLabel = copy.medianViews ?? "Median Views";
  const p75ViewsLabel = copy.p75Views ?? "P75 Views";
  const hitRateLabel = copy.hitRate ?? "Hit Rate";
  const confidenceLabel = copy.confidence ?? "Confidence";
  const postsLabel = copy.posts ?? "posts";
  const chartData = data.map((point) => ({
    ...point,
    displayType: copy.mediaTypes?.[point.type] ?? point.type,
  }));

  if (!data.length) {
    return <ChartEmptyState label={copy.noData} height={220} />;
  }

  return (
    <>
      <AxisHint
        x={copy.contentType ?? "Content Type"}
        y={`${medianViewsLabel} / ${copy.engagementRate} / ${copy.shareRate}`}
      />
      <ChartLegend
        className="mb-2"
        items={[
          { label: medianViewsLabel, color: chartColors.views, shape: "dot" },
          { label: copy.engagementRate, color: chartColors.engagement, shape: "line" },
          { label: copy.shareRate, color: chartColors.share, shape: "line" },
        ]}
      />
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="displayType" tick={axisTick} tickLine={false} axisLine={false} />
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
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as ContentTypeChartProps["data"][number];
              return (
                <ChartTooltip
                  title={String(label)}
                  subtitle={`${point.postCount.toLocaleString()} ${postsLabel} · ${confidenceLabel}: ${
                    copy.confidenceLevels?.[point.confidence] ?? point.confidence
                  }`}
                  rows={[
                    {
                      label: medianViewsLabel,
                      value: point.medianViews.toLocaleString(),
                      color: chartColors.views,
                    },
                    { label: copy.avgViews, value: point.avgViews.toLocaleString() },
                    { label: p75ViewsLabel, value: point.p75Views.toLocaleString() },
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
                    { label: hitRateLabel, value: `${point.hitRate}%`, muted: true },
                  ]}
                />
              );
            }}
          />
          <Bar
            yAxisId="views"
            dataKey="medianViews"
            name={medianViewsLabel}
            fill={chartColors.views}
            radius={barRadius}
            maxBarSize={24}
            {...motion}
          >
            {chartData.map((entry) => (
              <Cell key={entry.type} fillOpacity={CONFIDENCE_OPACITY[entry.confidence]} />
            ))}
          </Bar>
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
