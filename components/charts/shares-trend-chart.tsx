"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AxisHint from "./axis-hint";
import {
  axisTick,
  barRadius,
  chartColors,
  compactAxisTick,
  compactChartMargin,
  formatShortDate,
  gridProps,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";

interface SharesTrendChartProps {
  data: Array<{ date: string; shares: number }>;
  dateLocale?: string;
  timeZone: string;
  labels?: {
    date: string;
    shares: string;
    empty: string;
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

  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
        {copy.empty}
      </div>
    );
  }

  return (
    <>
      <AxisHint x={copy.date} y={copy.shares} />
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatShortDate(value, locale, timeZone)}
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={34} />
          <Tooltip
            formatter={(v) => [(v as number).toLocaleString(locale), copy.shares]}
            labelFormatter={(v) => formatShortDate(String(v), locale, timeZone)}
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
