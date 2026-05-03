"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AxisHint from "./axis-hint";
import {
  chartColors,
  compactAxisTick,
  compactChartMargin,
  formatShortDate,
  gridProps,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";

interface DataPoint {
  date: string;
  viralityRate: number;
}

interface Props {
  data: DataPoint[];
}

export default function ViralityRateChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
        No data
      </div>
    );
  }

  return (
    <>
      <AxisHint x="Date" y="Shares / Views" />
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatShortDate(value)}
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `${v}%`}
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            labelFormatter={(v) => formatShortDate(String(v))}
            formatter={(v) => [`${v}%`, "Shares / Views"]}
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipLabelStyle}
          />
          <Line
            type="monotone"
            dataKey="viralityRate"
            stroke={chartColors.share}
            strokeWidth={1.5}
            dot={false}
            name="Virality Rate"
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
