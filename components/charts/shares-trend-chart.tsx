"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AxisHint from "./axis-hint";
import {
  barCursor,
  barRadius,
  chartColors,
  compactAxisTick,
  compactChartMargin,
  formatCompactNumber,
  spansMultipleYears,
  gridProps,
} from "./chart-style";
import {
  GranularityToggle,
  aggregateByGranularity,
  formatBucketLabel,
  formatBucketTooltipLabel,
  isPartialBucket,
  useGranularity,
} from "./granularity";
import { ChartEmptyState, ChartTooltip, useChartMotion } from "./chart-chrome";

interface SharesTrendChartProps {
  data: Array<{ date: string; shares: number }>;
  dateLocale?: string;
  timeZone: string;
  labels?: {
    date: string;
    shares: string;
    empty: string;
    granularityDay?: string;
    granularityGroup?: string;
    granularityWeek?: string;
    granularityMonth?: string;
    partialBucket?: string;
  };
}

export default function SharesTrendChart({
  data,
  dateLocale,
  timeZone,
  labels,
}: SharesTrendChartProps) {
  const locale = dateLocale ?? "en-US";
  const motion = useChartMotion();
  const copy = labels ?? {
    date: "Date",
    shares: "Shares",
    empty: "No shares data",
  };
  const granularityLabels = {
    day: copy.granularityDay ?? "Day",
    group: copy.granularityGroup,
    week: copy.granularityWeek ?? "Week",
    month: copy.granularityMonth ?? "Month",
  };

  const { granularity, setGranularity, showToggle } = useGranularity(
    data.map((point) => point.date),
    timeZone,
    "shares-trend",
  );

  if (!data.some((point) => point.shares > 0)) {
    return <ChartEmptyState label={copy.empty} height={160} />;
  }

  const series = (
    granularity === "day"
      ? data.map((point) => ({ ...point, days: 1 }))
      : aggregateByGranularity(
          data,
          granularity,
          timeZone,
          (point) => point.date,
          (items, bucket) => ({
            date: bucket,
            shares: items.reduce((sum, item) => sum + item.shares, 0),
            days: items.length,
          }),
        )
  ).map((point) => ({
    ...point,
    partial: isPartialBucket(point.date, granularity, timeZone, point.days),
  }));

  const withYear = spansMultipleYears(series.map((point) => point.date));

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <AxisHint x={copy.date} y={copy.shares} />
        {showToggle && (
          <GranularityToggle
            value={granularity}
            onChange={setGranularity}
            labels={granularityLabels}
          />
        )}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={series} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) =>
              formatBucketLabel(String(value), granularity, locale, timeZone, { year: withYear })
            }
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tickFormatter={formatCompactNumber}
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            cursor={barCursor}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as (typeof series)[number];
              return (
                <ChartTooltip
                  title={formatBucketTooltipLabel(String(label), granularity, locale, timeZone, {
                    year: withYear,
                  })}
                  subtitle={point.partial ? copy.partialBucket : undefined}
                  rows={[
                    {
                      label: copy.shares,
                      value: point.shares.toLocaleString(locale),
                      color: chartColors.share,
                    },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="shares"
            fill={chartColors.share}
            fillOpacity={0.78}
            radius={barRadius}
            maxBarSize={14}
            {...motion}
          >
            {series.map((point) => (
              <Cell key={point.date} fillOpacity={point.partial ? 0.35 : 0.78} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
