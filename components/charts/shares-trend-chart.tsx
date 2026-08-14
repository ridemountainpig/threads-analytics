"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AxisHint from "./axis-hint";
import {
  axisTick,
  barRadius,
  chartColors,
  compactAxisTick,
  compactChartMargin,
  spansMultipleYears,
  gridProps,
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

interface SharesTrendChartProps {
  data: Array<{ date: string; shares: number }>;
  dateLocale?: string;
  timeZone: string;
  labels?: {
    date: string;
    shares: string;
    empty: string;
    granularityDay?: string;
    granularityWeek?: string;
    granularityMonth?: string;
  };
}

export default function SharesTrendChart({
  data,
  dateLocale,
  timeZone,
  labels,
}: SharesTrendChartProps) {
  const locale = dateLocale ?? "en-US";
  const copy = labels ?? {
    date: "Date",
    shares: "Shares",
    empty: "No shares data",
  };
  const granularityLabels = {
    day: copy.granularityDay ?? "Day",
    week: copy.granularityWeek ?? "Week",
    month: copy.granularityMonth ?? "Month",
  };

  const { granularity, setGranularity, showToggle } = useGranularity(
    data.map((point) => point.date),
    timeZone,
    "shares-trend",
  );

  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
        {copy.empty}
      </div>
    );
  }

  const series =
    granularity === "day"
      ? data
      : aggregateByGranularity(
          data,
          granularity,
          timeZone,
          (point) => point.date,
          (items, bucket) => ({
            date: bucket,
            shares: items.reduce((sum, item) => sum + item.shares, 0),
          }),
        );

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
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={34} />
          <Tooltip
            formatter={(v) => [(v as number).toLocaleString(locale), copy.shares]}
            labelFormatter={(v) =>
              formatBucketTooltipLabel(String(v), granularity, locale, timeZone, {
                year: withYear,
              })
            }
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipLabelStyle}
          />
          <Bar dataKey="shares" fill={chartColors.bar} radius={barRadius} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
