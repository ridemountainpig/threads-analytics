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
  formatShortDate,
  gridProps,
  lineCursor,
  postsAxisDomain,
} from "./chart-style";
import {
  ChartAreaGradient,
  ChartEmptyState,
  ChartLegend,
  ChartTooltip,
  seriesDot,
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
      partial?: boolean;
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
    partialBucket?: string;
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
  // Weeks are keyed by their Monday, so they read as dates rather than "W05".
  return formatShortDate(period, locale, "UTC", { year: withYear });
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
          { label: copy.posts, color: chartColors.volume, shape: "dot" },
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
          {/* mirror keeps this hidden axis from pushing the visible ticks off-canvas. */}
          <YAxis yAxisId="posts" hide mirror domain={postsAxisDomain} />
          <Tooltip
            cursor={lineCursor}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as ViewsTrendChartProps["data"]["points"][number];
              return (
                <ChartTooltip
                  title={fmt(String(label))}
                  subtitle={point.partial ? copy.partialBucket : undefined}
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
            fill={chartColors.volume}
            radius={barRadius}
            maxBarSize={12}
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
            dot={seriesDot(chartColors.views, points.length)}
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
            dot={points.length === 1 ? seriesDot(chartColors.avgViews, 1) : false}
            activeDot={activeDot(chartColors.avgViews)}
            {...motion}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
