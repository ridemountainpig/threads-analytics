"use client";

import {
  ComposedChart,
  Area,
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
  chartColors,
  compactChartMargin,
  spansMultipleYears,
  gridProps,
  lineCursor,
} from "./chart-style";
import {
  GranularityToggle,
  aggregateByGranularity,
  formatBucketLabel,
  formatBucketTooltipLabel,
  isPartialBucket,
  useGranularity,
} from "./granularity";
import {
  ChartAreaGradient,
  ChartEmptyState,
  ChartLegend,
  ChartTooltip,
  seriesDot,
  useChartMotion,
} from "./chart-chrome";

interface EngagementRateChartProps {
  data: Array<{ date: string; rate: number | null; rollingAvg: number | null; views?: number }>;
  dateLocale?: string;
  timeZone: string;
  labels?: {
    dailyRate: string;
    sevenDayAvg: string;
    date?: string;
    engagementRate?: string;
    noData?: string;
    granularityDay?: string;
    granularityGroup?: string;
    granularityWeek?: string;
    granularityMonth?: string;
    partialBucket?: string;
  };
}

export default function EngagementRateChart({
  data,
  dateLocale,
  timeZone,
  labels,
}: EngagementRateChartProps) {
  const locale = dateLocale ?? "en-US";
  const motion = useChartMotion();
  const copy = labels ?? {
    dailyRate: "Daily Rate",
    sevenDayAvg: "7d Avg",
    noData: "No data",
  };
  const granularityLabels = {
    day: copy.granularityDay ?? "Day",
    group: copy.granularityGroup,
    week: copy.granularityWeek ?? "Week",
    month: copy.granularityMonth ?? "Month",
  };
  const rateLabel = copy.engagementRate ?? "Engagement Rate";

  const { granularity, setGranularity, showToggle } = useGranularity(
    data.map((point) => point.date),
    timeZone,
    "engagement-rate",
  );

  if (!data.some((point) => point.rate !== null)) {
    return <ChartEmptyState label={copy.noData} height={200} />;
  }

  const isDaily = granularity === "day";
  // Aggregated buckets carry the views-weighted engagement rate, matching how
  // the dashboard's headline rate is computed.
  const series = (
    isDaily
      ? data.map((point) => ({ ...point, days: 1 }))
      : aggregateByGranularity(
          data,
          granularity,
          timeZone,
          (point) => point.date,
          (items, bucket) => {
            const totalViews = items.reduce((sum, item) => sum + (item.views ?? 0), 0);
            const weighted = items.reduce(
              (sum, item) => sum + (item.rate ?? 0) * (item.views ?? 0),
              0,
            );
            return {
              date: bucket,
              rate: totalViews > 0 ? Math.round((weighted / totalViews) * 100) / 100 : null,
              rollingAvg: null,
              views: totalViews,
              days: items.length,
            };
          },
        )
  ).map((point) => ({
    ...point,
    partial: isPartialBucket(point.date, granularity, timeZone, point.days),
  }));
  const ratedPoints = series.filter((point) => point.rate !== null).length;

  const withYear = spansMultipleYears(series.map((point) => point.date));
  const seriesName = isDaily ? copy.dailyRate : rateLabel;

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <AxisHint x={copy.date ?? "Date"} y={rateLabel} />
        {showToggle && (
          <GranularityToggle
            value={granularity}
            onChange={setGranularity}
            labels={granularityLabels}
          />
        )}
      </div>
      <ChartLegend
        className="mb-2"
        items={[
          { label: seriesName, color: chartColors.engagement, shape: "line" },
          ...(isDaily
            ? [{ label: copy.sevenDayAvg, color: chartColors.trend, shape: "dash" as const }]
            : []),
        ]}
      />
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={series} margin={compactChartMargin}>
          <ChartAreaGradient id="engagement-rate-fill" color={chartColors.engagement} />
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) =>
              formatBucketLabel(String(value), granularity, locale, timeZone, { year: withYear })
            }
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={45}
          />
          <Tooltip
            cursor={lineCursor}
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
                      label: seriesName,
                      value: point.rate === null ? "—" : `${point.rate.toFixed(2)}%`,
                      color: chartColors.engagement,
                    },
                    ...(isDaily
                      ? [
                          {
                            label: copy.sevenDayAvg,
                            value:
                              point.rollingAvg === null ? "—" : `${point.rollingAvg.toFixed(2)}%`,
                            color: chartColors.trend,
                          },
                        ]
                      : []),
                  ]}
                />
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="none"
            fill="url(#engagement-rate-fill)"
            activeDot={false}
            tooltipType="none"
            connectNulls
            {...motion}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke={chartColors.engagement}
            strokeWidth={1.8}
            dot={seriesDot(chartColors.engagement, ratedPoints)}
            activeDot={activeDot(chartColors.engagement)}
            name={seriesName}
            connectNulls
            {...motion}
          />
          {isDaily && (
            <Line
              type="monotone"
              dataKey="rollingAvg"
              stroke={chartColors.trend}
              strokeWidth={1.5}
              dot={false}
              activeDot={activeDot(chartColors.trend)}
              strokeDasharray="4 3"
              name={copy.sevenDayAvg}
              connectNulls
              {...motion}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
