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
  compactChartMargin,
  formatCompactNumber,
  gridProps,
  legendStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";

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
  };
}

export default function PostLengthChart({ data, labels }: PostLengthChartProps) {
  const copy = labels ?? {
    avgViews: "Avg Views",
    posts: "posts",
    medianViews: "Median Views",
    p75Views: "P75 Views",
    hitRate: "Hit Rate",
    confidence: "Confidence",
    engagementRate: "Engagement Rate",
    replyRate: "Reply Rate",
  };
  const medianViewsLabel = copy.medianViews ?? "Median Views";
  const p75ViewsLabel = copy.p75Views ?? "P75 Views";
  const hitRateLabel = copy.hitRate ?? "Hit Rate";
  const confidenceLabel = copy.confidence ?? "Confidence";
  const postsLabel = copy.posts ?? "posts";

  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
        No data
      </div>
    );
  }

  return (
    <>
      <AxisHint
        x={copy.lengthBucket ?? "Character Count"}
        y={`${medianViewsLabel} / ${copy.engagementRate} / ${copy.replyRate}`}
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
            formatter={(v, name) => {
              const value = Number(v);
              if (String(name).includes("Rate")) return [`${value.toFixed(2)}%`, name];
              return [value.toLocaleString(), name];
            }}
            labelFormatter={(label, payload) => {
              const point = payload?.[0]?.payload;
              return point
                ? `${label} · ${point.postCount} ${postsLabel} · ${confidenceLabel}: ${copy.confidenceLevels?.[point.confidence as "low" | "medium" | "high"] ?? point.confidence}`
                : String(label);
            }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as PostLengthChartProps["data"][number];
              return (
                <div
                  style={tooltipStyle}
                  className="border-border bg-popover text-popover-foreground rounded border px-2 py-1 text-xs shadow-sm"
                >
                  <p style={tooltipLabelStyle}>
                    {label} · {point.postCount} {postsLabel}
                  </p>
                  <p>
                    {medianViewsLabel}: {point.medianViews.toLocaleString()}
                  </p>
                  <p>
                    {copy.avgViews}: {point.avgViews.toLocaleString()}
                  </p>
                  <p>
                    {p75ViewsLabel}: {point.p75Views.toLocaleString()}
                  </p>
                  <p>
                    {copy.engagementRate}: {point.engagementRate.toFixed(2)}%
                  </p>
                  <p>
                    {copy.replyRate}: {point.replyRate.toFixed(2)}%
                  </p>
                  <p>
                    {hitRateLabel}: {point.hitRate}%
                  </p>
                  <p className="text-muted-foreground">
                    {confidenceLabel}:{" "}
                    {copy.confidenceLevels?.[point.confidence] ?? point.confidence}
                  </p>
                </div>
              );
            }}
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipLabelStyle}
          />
          <Legend iconType="square" iconSize={10} wrapperStyle={legendStyle} />
          <Bar
            yAxisId="views"
            dataKey="medianViews"
            name={medianViewsLabel}
            fill={chartColors.bar}
            radius={barRadius}
            maxBarSize={28}
          >
            {data.map((entry) => (
              <Cell
                key={entry.bucket}
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
            strokeWidth={1.5}
            dot={{ r: 2 }}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="replyRate"
            name={copy.replyRate}
            stroke={chartColors.reply}
            strokeWidth={1.5}
            dot={{ r: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
