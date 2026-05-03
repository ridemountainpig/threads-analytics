"use client";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AxisHint from "./axis-hint";
import {
  barRadius,
  chartColors,
  compactAxisTick,
  compactChartMargin,
  formatCompactNumber,
  gridProps,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";

interface DataPoint {
  day: string;
  avgViews: number;
  medianViews: number;
  postCount: number;
  engagementRate: number;
  hitRate: number;
  confidence: "low" | "medium" | "high";
}

interface Props {
  data: DataPoint[];
  labels?: {
    days: readonly string[];
    posts: string;
    avgViews: string;
    weekday?: string;
    medianViews?: string;
    hitRate?: string;
    confidence?: string;
    confidenceLevels?: Record<"low" | "medium" | "high", string>;
    engagementRate: string;
  };
}

export default function DayOfWeekChart({ data, labels }: Props) {
  const copy = labels ?? {
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    posts: "Posts",
    avgViews: "Avg Views",
    medianViews: "Median Views",
    hitRate: "Hit Rate",
    confidence: "Confidence",
    engagementRate: "Engagement Rate",
  };
  const medianViewsLabel = copy.medianViews ?? "Median Views";
  const hitRateLabel = copy.hitRate ?? "Hit Rate";
  const confidenceLabel = copy.confidence ?? "Confidence";
  const chartData = data.map((item, index) => ({ ...item, day: copy.days[index] ?? item.day }));

  if (!data.length || data.every((d) => d.medianViews === 0)) {
    return (
      <div className="text-muted-foreground flex h-[160px] items-center justify-center text-sm">
        No data
      </div>
    );
  }

  return (
    <>
      <AxisHint
        x={copy.weekday ?? "Weekday"}
        y={`${medianViewsLabel} / ${copy.engagementRate} / ${copy.posts}`}
      />
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={chartData} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="day" tick={compactAxisTick} tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="views"
            tickFormatter={formatCompactNumber}
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <YAxis yAxisId="posts" hide domain={[0, "dataMax + 1"]} />
          <YAxis
            yAxisId="rate"
            orientation="right"
            tickFormatter={(v: number) => `${v}%`}
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
            width={34}
          />
          <Tooltip
            formatter={(v, name) => {
              const value = Number(v);
              if (name === copy.engagementRate) return [`${value.toFixed(2)}%`, name];
              if (name === copy.posts) return [value.toLocaleString(), name];
              return [formatCompactNumber(value), name];
            }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as DataPoint;
              return (
                <div
                  style={tooltipStyle}
                  className="border-border bg-popover text-popover-foreground rounded border px-2 py-1 text-xs shadow-sm"
                >
                  <p style={tooltipLabelStyle}>{label}</p>
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
          <Bar
            yAxisId="posts"
            dataKey="postCount"
            fill={chartColors.bar}
            radius={barRadius}
            name={copy.posts}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.day}
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
            stroke={chartColors.views}
            strokeWidth={1.8}
            dot={{ r: 2 }}
            name={medianViewsLabel}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="engagementRate"
            stroke={chartColors.engagement}
            strokeWidth={1.5}
            dot={{ r: 2 }}
            name={copy.engagementRate}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
