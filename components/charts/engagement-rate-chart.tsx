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
  formatShortDate,
  gridProps,
  legendStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";

interface EngagementRateChartProps {
  data: Array<{ date: string; rate: number; rollingAvg: number }>;
  dateLocale?: string;
  labels?: {
    dailyRate: string;
    sevenDayAvg: string;
    date?: string;
    engagementRate?: string;
    noData?: string;
  };
}

export default function EngagementRateChart({
  data,
  dateLocale,
  labels,
}: EngagementRateChartProps) {
  const copy = labels ?? {
    dailyRate: "Daily Rate",
    sevenDayAvg: "7d Avg",
    noData: "No data",
  };

  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
        {copy.noData}
      </div>
    );
  }

  return (
    <>
      <AxisHint x={copy.date ?? "Date"} y={copy.engagementRate ?? "Engagement Rate"} />
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatShortDate(value, dateLocale)}
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
              name === copy.dailyRate || name === "rate" ? copy.dailyRate : copy.sevenDayAvg,
            ]}
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
            name={copy.dailyRate}
          />
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
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
