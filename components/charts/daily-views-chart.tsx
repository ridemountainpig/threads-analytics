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
  barRadius,
  chartColors,
  compactChartMargin,
  formatCompactNumber,
  formatShortDate,
  gridProps,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";
import AxisHint from "./axis-hint";

interface DailyViewsChartProps {
  data: Array<{ end_time: string; value: number }>;
  dateLocale?: string;
  labels?: {
    views: string;
    sevenDayAvg: string;
    baseline?: string;
    date?: string;
  };
}

function getMedian(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
  return sorted[mid] ?? 0;
}

export default function DailyViewsChart({ data, dateLocale, labels }: DailyViewsChartProps) {
  const copy = labels ?? {
    views: "Views",
    sevenDayAvg: "7d Avg",
    baseline: "Baseline",
  };
  const baselineLabel = copy.baseline ?? "Baseline";

  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
        No data
      </div>
    );
  }

  const baseline = getMedian(data.map((point) => point.value).filter((value) => value > 0));
  const chartData = data.map((point, index) => {
    const window = data.slice(Math.max(0, index - 6), index + 1);
    const rollingAvg =
      window.reduce((sum, item) => sum + item.value, 0) / Math.max(1, window.length);
    return {
      ...point,
      rollingAvg: Math.round(rollingAvg),
    };
  });

  return (
    <>
      <AxisHint x={copy.date ?? "Date"} y={`${copy.views} / ${copy.sevenDayAvg}`} />
      <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-3 text-[11px]">
        <span className="inline-flex items-center gap-1">
          <span className="bg-muted-foreground inline-block h-2.5 w-2.5 rounded-[2px]" />
          {copy.views}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-px w-5" style={{ backgroundColor: chartColors.views }} />
          {copy.sevenDayAvg}
        </span>
        {baseline > 0 && (
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block h-px w-5 border-t"
              style={{ borderColor: chartColors.trend, borderTopStyle: "dashed" }}
            />
            {baselineLabel}: {baseline.toLocaleString()}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="end_time"
            tickFormatter={(value) => formatShortDate(value, dateLocale)}
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
            formatter={(v, name) => {
              const value = Number(v);
              if (name === copy.sevenDayAvg) return [value.toLocaleString(), copy.sevenDayAvg];
              return [value.toLocaleString(), copy.views];
            }}
            labelFormatter={(label) => formatShortDate(label as string, dateLocale)}
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipLabelStyle}
          />
          {baseline > 0 && (
            <ReferenceLine y={baseline} stroke={chartColors.trend} strokeDasharray="4 3" />
          )}
          <Bar
            dataKey="value"
            name={copy.views}
            fill={chartColors.bar}
            radius={barRadius}
            maxBarSize={20}
          />
          <Line
            type="monotone"
            dataKey="rollingAvg"
            name={copy.sevenDayAvg}
            stroke={chartColors.views}
            strokeWidth={1.8}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
