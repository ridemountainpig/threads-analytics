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
  dateLocale?: string;
  labels?: {
    date?: string;
    viralityRate?: string;
    sharesPerViews?: string;
    noData?: string;
  };
}

export default function ViralityRateChart({ data, dateLocale, labels }: Props) {
  const copy = labels ?? {
    date: "Date",
    viralityRate: "Virality Rate",
    sharesPerViews: "Shares / Views",
    noData: "No data",
  };

  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
        {copy.noData}
      </div>
    );
  }

  return (
    <>
      <AxisHint x={copy.date ?? "Date"} y={copy.sharesPerViews ?? "Shares / Views"} />
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatShortDate(value, dateLocale)}
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
            labelFormatter={(v) => formatShortDate(String(v), dateLocale)}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as DataPoint;
              return (
                <div
                  style={tooltipStyle}
                  className="border-border bg-popover text-popover-foreground rounded border px-2 py-1 text-xs shadow-sm"
                >
                  <p style={tooltipLabelStyle}>{formatShortDate(point.date, dateLocale)}</p>
                  <p>
                    {copy.sharesPerViews}: {point.viralityRate.toFixed(2)}%
                  </p>
                </div>
              );
            }}
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
            name={copy.viralityRate}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
