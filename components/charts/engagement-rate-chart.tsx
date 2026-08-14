"use client";

import {
  LineChart,
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
  chartColors,
  compactChartMargin,
  spansMultipleYears,
  gridProps,
  legendStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";
import {
  GranularityToggle,
  aggregateByGranularity,
  formatBucketLabel,
  formatBucketTooltipLabel,
  useGranularity,
} from "./granularity";

interface EngagementRateChartProps {
  data: Array<{ date: string; rate: number; rollingAvg: number; views?: number }>;
  dateLocale?: string;
  timeZone: string;
  labels?: {
    dailyRate: string;
    sevenDayAvg: string;
    date?: string;
    engagementRate?: string;
    noData?: string;
    granularityDay?: string;
    granularityWeek?: string;
    granularityMonth?: string;
  };
}

export default function EngagementRateChart({
  data,
  dateLocale,
  timeZone,
  labels,
}: EngagementRateChartProps) {
  const locale = dateLocale ?? "en-US";
  const copy = labels ?? {
    dailyRate: "Daily Rate",
    sevenDayAvg: "7d Avg",
    noData: "No data",
  };
  const granularityLabels = {
    day: copy.granularityDay ?? "Day",
    week: copy.granularityWeek ?? "Week",
    month: copy.granularityMonth ?? "Month",
  };
  const rateLabel = copy.engagementRate ?? "Engagement Rate";

  const { granularity, setGranularity, showToggle } = useGranularity(
    data.map((point) => point.date),
    timeZone,
    "engagement-rate",
  );

  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
        {copy.noData}
      </div>
    );
  }

  const isDaily = granularity === "day";
  // Aggregated buckets carry the views-weighted engagement rate, matching how
  // the dashboard's headline rate is computed.
  const series = isDaily
    ? data
    : aggregateByGranularity(
        data,
        granularity,
        timeZone,
        (point) => point.date,
        (items, bucket) => {
          const totalViews = items.reduce((sum, item) => sum + (item.views ?? 0), 0);
          const rate =
            totalViews > 0
              ? items.reduce((sum, item) => sum + item.rate * (item.views ?? 0), 0) / totalViews
              : items.reduce((sum, item) => sum + item.rate, 0) / Math.max(1, items.length);
          return {
            date: bucket,
            rate: Math.round(rate * 100) / 100,
            rollingAvg: 0,
            views: totalViews,
          };
        },
      );

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
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={series} margin={compactChartMargin}>
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
            formatter={(v, name) => [
              `${(v as number).toFixed(2)}%`,
              name === copy.sevenDayAvg ? copy.sevenDayAvg : seriesName,
            ]}
            labelFormatter={(label) =>
              formatBucketTooltipLabel(String(label), granularity, locale, timeZone, {
                year: withYear,
              })
            }
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipLabelStyle}
          />
          <Legend iconType="line" iconSize={12} wrapperStyle={legendStyle} />
          <Line
            type="monotone"
            dataKey="rate"
            stroke={chartColors.engagement}
            strokeWidth={1.5}
            dot={{ r: 2, fill: chartColors.engagement }}
            activeDot={{ r: 4 }}
            name={seriesName}
          />
          {isDaily && (
            <Line
              type="monotone"
              dataKey="rollingAvg"
              stroke={chartColors.trend}
              strokeWidth={1.5}
              dot={{ r: 2, fill: chartColors.trend }}
              activeDot={{ r: 4 }}
              strokeDasharray="4 2"
              name={copy.sevenDayAvg}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
