"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  axisTick,
  barCursor,
  barRadius,
  chartColors,
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
  useGranularity,
} from "./granularity";
import AxisHint from "./axis-hint";
import { ChartEmptyState, ChartLegend, ChartTooltip, useChartMotion } from "./chart-chrome";

interface DailyViewsChartProps {
  data: Array<{ end_time: string; value: number }>;
  dateLocale?: string;
  timeZone: string;
  labels?: {
    views: string;
    sevenDayAvg: string;
    baseline?: string;
    date?: string;
    noData?: string;
    granularityDay?: string;
    granularityWeek?: string;
    granularityMonth?: string;
  };
}

function getMedian(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
  return sorted[mid] ?? 0;
}

export default function DailyViewsChart({
  data,
  dateLocale,
  timeZone,
  labels,
}: DailyViewsChartProps) {
  const locale = dateLocale ?? "en-US";
  const motion = useChartMotion();
  const copy = labels ?? {
    views: "Views",
    sevenDayAvg: "7d Avg",
    baseline: "Baseline",
    noData: "No data",
  };
  const baselineLabel = copy.baseline ?? "Baseline";
  const granularityLabels = {
    day: copy.granularityDay ?? "Day",
    week: copy.granularityWeek ?? "Week",
    month: copy.granularityMonth ?? "Month",
  };

  const { granularity, setGranularity, showToggle } = useGranularity(
    data.map((point) => point.end_time),
    timeZone,
    "daily-views",
  );

  if (!data.length) {
    return <ChartEmptyState label={copy.noData} height={220} />;
  }

  const isDaily = granularity === "day";
  const series = isDaily
    ? data
    : aggregateByGranularity(
        data,
        granularity,
        timeZone,
        (point) => point.end_time,
        (items, bucket) => ({
          end_time: bucket,
          value: items.reduce((sum, item) => sum + item.value, 0),
        }),
      );

  const withYear = spansMultipleYears(series.map((point) => point.end_time));
  const baseline = getMedian(series.map((point) => point.value).filter((value) => value > 0));
  const chartData = series.map((point, index) => {
    if (!isDaily) return point;
    const window = series.slice(Math.max(0, index - 6), index + 1);
    const rollingAvg =
      window.reduce((sum, item) => sum + item.value, 0) / Math.max(1, window.length);
    return {
      ...point,
      rollingAvg: Math.round(rollingAvg),
    };
  });

  return (
    <>
      <AxisHint
        x={copy.date ?? "Date"}
        y={isDaily ? `${copy.views} / ${copy.sevenDayAvg}` : copy.views}
      />
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <ChartLegend
          items={[
            { label: copy.views, color: chartColors.views, shape: "dot" },
            ...(isDaily
              ? [{ label: copy.sevenDayAvg, color: chartColors.trend, shape: "line" as const }]
              : []),
            ...(baseline > 0
              ? [
                  {
                    label: `${baselineLabel} ${baseline.toLocaleString(locale)}`,
                    color: chartColors.trend,
                    shape: "dash" as const,
                  },
                ]
              : []),
          ]}
        />
        {showToggle && (
          <GranularityToggle
            value={granularity}
            onChange={setGranularity}
            labels={granularityLabels}
          />
        )}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="end_time"
            tickFormatter={(value) =>
              formatBucketLabel(String(value), granularity, locale, timeZone, { year: withYear })
            }
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatCompactNumber}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            cursor={barCursor}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as (typeof chartData)[number];
              const rollingAvg = "rollingAvg" in point ? point.rollingAvg : undefined;
              return (
                <ChartTooltip
                  title={formatBucketTooltipLabel(String(label), granularity, locale, timeZone, {
                    year: withYear,
                  })}
                  rows={[
                    {
                      label: copy.views,
                      value: point.value.toLocaleString(locale),
                      color: chartColors.views,
                    },
                    ...(isDaily && rollingAvg != null
                      ? [
                          {
                            label: copy.sevenDayAvg,
                            value: rollingAvg.toLocaleString(locale),
                            color: chartColors.trend,
                          },
                        ]
                      : []),
                  ]}
                />
              );
            }}
          />
          {baseline > 0 && (
            <ReferenceLine y={baseline} stroke={chartColors.trend} strokeDasharray="4 3" />
          )}
          <Bar
            dataKey="value"
            name={copy.views}
            fill={chartColors.views}
            fillOpacity={0.72}
            radius={barRadius}
            maxBarSize={18}
            {...motion}
          />
          {isDaily && (
            <Line
              type="monotone"
              dataKey="rollingAvg"
              name={copy.sevenDayAvg}
              stroke={chartColors.trend}
              strokeWidth={1.8}
              dot={false}
              {...motion}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
