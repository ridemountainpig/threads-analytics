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
  activeDot,
  barRadius,
  chartColors,
  compactAxisTick,
  compactChartMargin,
  formatCompactNumber,
  gridProps,
  lineCursor,
  postsAxisDomain,
} from "./chart-style";
import { ChartEmptyState, ChartLegend, ChartTooltip, useChartMotion } from "./chart-chrome";

interface DataPoint {
  day: string;
  avgViews: number | null;
  medianViews: number | null;
  postCount: number;
  engagementRate: number | null;
  hitRate: number | null;
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
    noData?: string;
  };
}

const CONFIDENCE_OPACITY: Record<"low" | "medium" | "high", number> = {
  low: 0.4,
  medium: 0.7,
  high: 1,
};

export default function DayOfWeekChart({ data, labels }: Props) {
  const motion = useChartMotion();
  const copy = labels ?? {
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    posts: "Posts",
    avgViews: "Avg Views",
    medianViews: "Median Views",
    hitRate: "Hit Rate",
    confidence: "Confidence",
    engagementRate: "Engagement Rate",
    noData: "No data",
  };
  const medianViewsLabel = copy.medianViews ?? "Median Views";
  const hitRateLabel = copy.hitRate ?? "Hit Rate";
  const confidenceLabel = copy.confidence ?? "Confidence";
  const chartData = data.map((item, index) => ({ ...item, day: copy.days[index] ?? item.day }));

  if (!data.length || data.every((d) => d.postCount === 0)) {
    return <ChartEmptyState label={copy.noData} height={180} />;
  }

  return (
    <>
      <AxisHint
        x={copy.weekday ?? "Weekday"}
        y={`${medianViewsLabel} / ${copy.engagementRate} / ${copy.posts}`}
      />
      <ChartLegend
        className="mb-2"
        items={[
          { label: medianViewsLabel, color: chartColors.views, shape: "line" },
          { label: copy.engagementRate, color: chartColors.engagement, shape: "line" },
          { label: copy.posts, color: chartColors.volume, shape: "dot" },
        ]}
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
          {/* mirror keeps this hidden axis from pushing the visible ticks off-canvas. */}
          <YAxis yAxisId="posts" hide mirror domain={postsAxisDomain} />
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
            cursor={lineCursor}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as DataPoint;
              return (
                <ChartTooltip
                  title={String(label)}
                  subtitle={
                    point.postCount > 0
                      ? `${confidenceLabel}: ${copy.confidenceLevels?.[point.confidence] ?? point.confidence}`
                      : undefined
                  }
                  rows={[
                    {
                      label: medianViewsLabel,
                      value: point.medianViews?.toLocaleString() ?? "—",
                      color: chartColors.views,
                    },
                    { label: copy.avgViews, value: point.avgViews?.toLocaleString() ?? "—" },
                    {
                      label: copy.engagementRate,
                      value:
                        point.engagementRate === null ? "—" : `${point.engagementRate.toFixed(2)}%`,
                      color: chartColors.engagement,
                    },
                    {
                      label: hitRateLabel,
                      value: point.hitRate === null ? "—" : `${point.hitRate}%`,
                    },
                    { label: copy.posts, value: point.postCount.toLocaleString(), muted: true },
                  ]}
                />
              );
            }}
          />
          <Bar
            yAxisId="posts"
            dataKey="postCount"
            fill={chartColors.volume}
            radius={barRadius}
            name={copy.posts}
            maxBarSize={12}
            {...motion}
          >
            {chartData.map((entry) => (
              <Cell key={entry.day} fillOpacity={CONFIDENCE_OPACITY[entry.confidence]} />
            ))}
          </Bar>
          <Line
            yAxisId="views"
            type="monotone"
            dataKey="medianViews"
            stroke={chartColors.views}
            strokeWidth={2}
            dot={{ r: 2.5, fill: chartColors.views, strokeWidth: 0 }}
            activeDot={activeDot(chartColors.views)}
            name={medianViewsLabel}
            {...motion}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="engagementRate"
            stroke={chartColors.engagement}
            strokeWidth={1.5}
            dot={{ r: 2.5, fill: chartColors.engagement, strokeWidth: 0 }}
            activeDot={activeDot(chartColors.engagement)}
            name={copy.engagementRate}
            {...motion}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
