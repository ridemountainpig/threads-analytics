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

interface PostLengthChartProps {
  data: Array<{
    bucket: string;
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
    lengthBucket?: string;
    medianViews?: string;
    p75Views?: string;
    hitRate?: string;
    confidence?: string;
    confidenceLevels?: Record<"low" | "medium" | "high", string>;
    engagementRate: string;
    replyRate: string;
    noData?: string;
  };
}

const CONFIDENCE_OPACITY: Record<"low" | "medium" | "high", number> = {
  low: 0.35,
  medium: 0.65,
  high: 1,
};

export default function PostLengthChart({ data, labels }: PostLengthChartProps) {
  const motion = useChartMotion();
  const copy = labels ?? {
    avgViews: "Avg Views",
    posts: "posts",
    medianViews: "Median Views",
    p75Views: "P75 Views",
    hitRate: "Hit Rate",
    confidence: "Confidence",
    engagementRate: "Engagement Rate",
    replyRate: "Reply Rate",
    noData: "No data",
  };
  const medianViewsLabel = copy.medianViews ?? "Median Views";
  const p75ViewsLabel = copy.p75Views ?? "P75 Views";
  const hitRateLabel = copy.hitRate ?? "Hit Rate";
  const confidenceLabel = copy.confidence ?? "Confidence";
  const postsLabel = copy.posts ?? "posts";

  if (!data.length) {
    return <ChartEmptyState label={copy.noData} height={220} />;
  }

  return (
    <>
      <AxisHint
        x={copy.lengthBucket ?? "Character Count"}
        y={`${medianViewsLabel} / ${copy.engagementRate} / ${copy.replyRate}`}
      />
      <ChartLegend
        className="mb-2"
        items={[
          { label: medianViewsLabel, color: chartColors.views, shape: "dot" },
          { label: copy.engagementRate, color: chartColors.engagement, shape: "line" },
          { label: copy.replyRate, color: chartColors.reply, shape: "line" },
        ]}
      />
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="bucket" tick={axisTick} tickLine={false} axisLine={false} />
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
              const point = payload[0]?.payload as PostLengthChartProps["data"][number];
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
                      label: copy.replyRate,
                      value: `${point.replyRate.toFixed(2)}%`,
                      color: chartColors.reply,
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
            maxBarSize={28}
            {...motion}
          >
            {data.map((entry) => (
              <Cell key={entry.bucket} fillOpacity={CONFIDENCE_OPACITY[entry.confidence]} />
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
            dataKey="replyRate"
            name={copy.replyRate}
            stroke={chartColors.reply}
            strokeWidth={1.5}
            dot={false}
            activeDot={activeDot(chartColors.reply)}
            {...motion}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
