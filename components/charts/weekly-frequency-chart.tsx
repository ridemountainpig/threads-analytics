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
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";

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
    engagementRate: string;
    shareRate: string;
  };
}

function formatWeek(week: string) {
  return week.replace("2026-", "");
}

export default function WeeklyFrequencyChart({ data, labels }: WeeklyFrequencyChartProps) {
  const copy = labels ?? {
    posts: "Posts",
    avgViews: "Avg Views",
    medianViews: "Median Views",
    hitRate: "Hit Rate",
    confidence: "Confidence",
    engagementRate: "Engagement Rate",
    shareRate: "Share Rate",
  };
  const medianViewsLabel = copy.medianViews ?? "Median Views";
  const hitRateLabel = copy.hitRate ?? "Hit Rate";
  const confidenceLabel = copy.confidence ?? "Confidence";

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
        x={copy.week ?? "Week"}
        y={`${medianViewsLabel} / ${copy.engagementRate} / ${copy.shareRate} / ${copy.posts}`}
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
            formatter={(v, name) => {
              const value = Number(v);
              if (String(name).includes("Rate")) return [`${value.toFixed(2)}%`, name];
              return [value.toLocaleString(), name];
            }}
            labelFormatter={(label, payload) => {
              const point = payload?.[0]?.payload;
              return point
                ? `${formatWeek(String(label))} · ${confidenceLabel}: ${point.confidence}`
                : formatWeek(String(label));
            }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as WeeklyFrequencyChartProps["data"][number];
              return (
                <div
                  style={tooltipStyle}
                  className="border-border bg-popover text-popover-foreground rounded border px-2 py-1 text-xs shadow-sm"
                >
                  <p style={tooltipLabelStyle}>{formatWeek(String(label))}</p>
                  <p>
                    {copy.posts}: {point.postCount.toLocaleString()}
                  </p>
                  <p>
                    {medianViewsLabel}: {point.medianViews.toLocaleString()}
                  </p>
                  <p>
                    {copy.avgViews}: {point.avgViews.toLocaleString()}
                  </p>
                  <p>
                    {copy.engagementRate}: {point.engagementRate.toFixed(2)}%
                  </p>
                  <p>
                    {copy.shareRate}: {point.shareRate.toFixed(2)}%
                  </p>
                  <p>
                    {hitRateLabel}: {point.hitRate}%
                  </p>
                  <p className="text-muted-foreground">
                    {confidenceLabel}: {point.confidence}
                  </p>
                </div>
              );
            }}
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipLabelStyle}
          />
          <Legend iconSize={10} wrapperStyle={legendStyle} />
          <Bar
            yAxisId="posts"
            dataKey="postCount"
            name={copy.posts}
            fill={chartColors.bar}
            radius={barRadius}
            maxBarSize={20}
          >
            {data.map((entry) => (
              <Cell
                key={entry.week}
                fillOpacity={
                  entry.confidence === "low" ? 0.4 : entry.confidence === "medium" ? 0.7 : 1
                }
              />
            ))}
          </Bar>
          <Line
            yAxisId="views"
            type="monotone"
            dataKey="medianViews"
            name={medianViewsLabel}
            stroke={chartColors.views}
            strokeWidth={2}
            dot={{ r: 2, fill: chartColors.views }}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="engagementRate"
            name={copy.engagementRate}
            stroke={chartColors.engagement}
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="shareRate"
            name={copy.shareRate}
            stroke={chartColors.share}
            strokeWidth={1.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
