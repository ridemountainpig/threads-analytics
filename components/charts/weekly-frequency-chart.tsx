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
  formatShortDate,
  gridProps,
  lineCursor,
  postsAxisDomain,
  spansMultipleYears,
} from "./chart-style";
import {
  ChartEmptyState,
  ChartLegend,
  ChartTooltip,
  seriesDot,
  useChartMotion,
} from "./chart-chrome";

interface WeeklyFrequencyChartProps {
  data: Array<{
    week: string;
    postCount: number;
    avgViews: number | null;
    medianViews: number | null;
    engagementRate: number | null;
    shareRate: number | null;
    hitRate: number | null;
    confidence: "low" | "medium" | "high";
    partial?: boolean;
  }>;
  dateLocale?: string;
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
    partialBucket?: string;
  };
}

const CONFIDENCE_OPACITY: Record<"low" | "medium" | "high", number> = {
  low: 0.4,
  medium: 0.7,
  high: 1,
};

export default function WeeklyFrequencyChart({
  data,
  dateLocale,
  labels,
}: WeeklyFrequencyChartProps) {
  const motion = useChartMotion();
  const locale = dateLocale ?? "en-US";
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

  if (!data.some((week) => week.postCount > 0)) {
    return <ChartEmptyState label={copy.noData} height={240} />;
  }

  // Weeks are keyed by their Monday (YYYY-MM-DD), already in the analytics zone.
  const withYear = spansMultipleYears(data.map((week) => week.week));
  const formatWeek = (week: string) => formatShortDate(week, locale, "UTC", { year: withYear });
  const postedWeeks = data.filter((week) => week.postCount > 0).length;
  const formatRate = (value: number | null) => (value === null ? "—" : `${value.toFixed(2)}%`);
  const formatCount = (value: number | null) =>
    value === null ? "—" : value.toLocaleString(locale);

  return (
    <>
      <AxisHint
        x={copy.week ?? "Week"}
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
          {/* mirror keeps this hidden axis from pushing the visible ticks off-canvas. */}
          <YAxis yAxisId="posts" hide mirror domain={postsAxisDomain} />
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
                  subtitle={
                    [
                      point.postCount > 0
                        ? `${confidenceLabel}: ${copy.confidenceLevels?.[point.confidence] ?? point.confidence}`
                        : null,
                      point.partial ? copy.partialBucket : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || undefined
                  }
                  rows={[
                    {
                      label: medianViewsLabel,
                      value: formatCount(point.medianViews),
                      color: chartColors.views,
                    },
                    { label: copy.avgViews, value: formatCount(point.avgViews) },
                    {
                      label: copy.engagementRate,
                      value: formatRate(point.engagementRate),
                      color: chartColors.engagement,
                    },
                    { label: copy.shareRate, value: formatRate(point.shareRate) },
                    {
                      label: hitRateLabel,
                      value: point.hitRate === null ? "—" : `${point.hitRate}%`,
                    },
                    {
                      label: copy.posts,
                      value: point.postCount.toLocaleString(locale),
                      muted: true,
                    },
                  ]}
                />
              );
            }}
          />
          <Bar
            yAxisId="posts"
            dataKey="postCount"
            name={copy.posts}
            fill={chartColors.volume}
            radius={barRadius}
            maxBarSize={12}
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
            dot={seriesDot(chartColors.views, postedWeeks)}
            activeDot={activeDot(chartColors.views)}
            connectNulls
            {...motion}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="engagementRate"
            name={copy.engagementRate}
            stroke={chartColors.engagement}
            strokeWidth={1.5}
            dot={seriesDot(chartColors.engagement, postedWeeks)}
            activeDot={activeDot(chartColors.engagement)}
            connectNulls
            {...motion}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
