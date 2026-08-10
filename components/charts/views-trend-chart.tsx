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
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
        {copy.noData}
      </div>
    );
  }

  const withYear = new Set(points.map((point) => point.period.slice(0, 4))).size > 1;
  const fmt = (period: string) => formatPeriod(period, granularity, locale, withYear);

  return (
    <>
      <AxisHint
        x={granularity === "month" ? copy.month : copy.week}
        y={`${copy.medianViews} / ${copy.avgViews} / ${copy.posts}`}
      />
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={points} margin={compactChartMargin}>
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
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as ViewsTrendChartProps["data"]["points"][number];
              return (
                <div
                  style={tooltipStyle}
                  className="border-border bg-popover text-popover-foreground rounded border px-2 py-1 text-xs shadow-sm"
                >
                  <p style={tooltipLabelStyle}>{fmt(String(label))}</p>
                  <p>
                    {copy.posts}: {point.postCount.toLocaleString(locale)}
                  </p>
                  <p>
                    {copy.medianViews}: {point.medianViews.toLocaleString(locale)}
                  </p>
                  <p>
                    {copy.avgViews}: {point.avgViews.toLocaleString(locale)}
                  </p>
                  <p>
                    {copy.p75Views}: {point.p75Views.toLocaleString(locale)}
                  </p>
                </div>
              );
            }}
          />
          <Legend iconSize={10} wrapperStyle={legendStyle} />
          <Bar
            yAxisId="posts"
            dataKey="postCount"
            name={copy.posts}
            fill={chartColors.bar}
            fillOpacity={0.35}
            radius={barRadius}
            maxBarSize={20}
          />
          <Line
            yAxisId="views"
            type="monotone"
            dataKey="medianViews"
            name={copy.medianViews}
            stroke={chartColors.views}
            strokeWidth={2}
            dot={{ r: 2, fill: chartColors.views }}
            activeDot={{ r: 4 }}
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
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
