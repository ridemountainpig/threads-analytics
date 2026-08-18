"use client";

import {
  ComposedChart,
  Area,
  Bar,
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
import {
  ChartAreaGradient,
  ChartEmptyState,
  ChartLegend,
  ChartTooltip,
  useChartMotion,
} from "./chart-chrome";

interface ViewsTrendChartProps {
  data: {
    granularity: "week" | "month";
    points: Array<{
      period: string;
      postCount: number;
      medianViews: number;
      avgViews: number;
      p75Views: number;
    }>;
  };
  dateLocale?: string;
  labels?: {
    posts: string;
    medianViews: string;
    avgViews: string;
    p75Views: string;
    week: string;
    month: string;
    noData: string;
  };
}

function formatPeriod(
  period: string,
  granularity: "week" | "month",
  locale: string,
  withYear: boolean,
) {
  if (granularity === "month") {
    // Period keys are YYYY-MM calendar months in the analytics time zone, so
    // format them as UTC to avoid shifting into a neighboring month.
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      year: withYear ? "2-digit" : undefined,
      timeZone: "UTC",
    }).format(new Date(`${period}-01T00:00:00Z`));
  }
  return withYear ? period : period.replace(/^\d{4}-/, "");
}

export default function ViewsTrendChart({ data, dateLocale, labels }: ViewsTrendChartProps) {
  const locale = dateLocale ?? "en-US";
  const motion = useChartMotion();
  const copy = labels ?? {
    posts: "Posts",
    medianViews: "Median Views",
    avgViews: "Avg Views",
    p75Views: "P75 Views",
    week: "Week",
    month: "Month",
    noData: "No data",
  };
  const { granularity, points } = data;

  if (!points.length) {
    return <ChartEmptyState label={copy.noData} height={240} />;
  }

  const withYear = new Set(points.map((point) => point.period.slice(0, 4))).size > 1;
  const fmt = (period: string) => formatPeriod(period, granularity, locale, withYear);

  return (
    <>
      <AxisHint
        x={granularity === "month" ? copy.month : copy.week}
        y={`${copy.medianViews} / ${copy.avgViews} / ${copy.posts}`}
      />
      <ChartLegend
        className="mb-2"
        items={[
          { label: copy.medianViews, color: chartColors.views, shape: "line" },
          { label: copy.avgViews, color: chartColors.avgViews, shape: "dash" },
          { label: copy.posts, color: chartColors.bar, shape: "dot" },
        ]}
      />
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={points} margin={compactChartMargin}>
          <ChartAreaGradient id="views-trend-fill" color={chartColors.views} />
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="period"
            tickFormatter={fmt}
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
          <YAxis yAxisId="posts" hide domain={[0, "dataMax + 2"]} />
          <Tooltip
            cursor={lineCursor}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as ViewsTrendChartProps["data"]["points"][number];
              return (
                <ChartTooltip
                  title={fmt(String(label))}
                  rows={[
                    {
                      label: copy.medianViews,
                      value: point.medianViews.toLocaleString(locale),
                      color: chartColors.views,
                    },
                    {
                      label: copy.avgViews,
                      value: point.avgViews.toLocaleString(locale),
                      color: chartColors.avgViews,
                    },
                    { label: copy.p75Views, value: point.p75Views.toLocaleString(locale) },
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
            fill={chartColors.bar}
            radius={barRadius}
            maxBarSize={16}
            {...motion}
          />
          <Area
            yAxisId="views"
            type="monotone"
            dataKey="medianViews"
            name={copy.medianViews}
            stroke="none"
            fill="url(#views-trend-fill)"
            activeDot={false}
            tooltipType="none"
            {...motion}
          />
          <Line
            yAxisId="views"
            type="monotone"
            dataKey="medianViews"
            name={copy.medianViews}
            stroke={chartColors.views}
            strokeWidth={2}
            dot={false}
            activeDot={activeDot(chartColors.views)}
            {...motion}
          />
          <Line
            yAxisId="views"
            type="monotone"
            dataKey="avgViews"
            name={copy.avgViews}
            stroke={chartColors.avgViews}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={activeDot(chartColors.avgViews)}
            {...motion}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
