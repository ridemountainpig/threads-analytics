"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  axisTick,
  chartColors,
  seriesColors,
  compactChartMargin,
  formatShortDate,
  spansMultipleYears,
  gridProps,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";
import AxisHint from "./axis-hint";

interface DemographicTrendChartProps {
  keys: string[];
  rows: Array<Record<string, string | number>>;
  /** Display names resolved on the server — see lib/demographic-labels. */
  keyLabels: Record<string, string>;
  dateLocale?: string;
  timeZone: string;
  labels?: {
    date: string;
    shareChange: string;
    noData: string;
    /** Localized name for "percentage point" — pp / 百分點 / ポイント. */
    pointSuffix: string;
    baseline: string;
  };
}

export default function DemographicTrendChart({
  keys,
  rows,
  keyLabels,
  dateLocale,
  timeZone,
  labels,
}: DemographicTrendChartProps) {
  const locale = dateLocale ?? "en-US";
  const copy = labels ?? {
    date: "Date",
    shareChange: "Share change",
    noData: "No data",
    pointSuffix: "pp",
    baseline: "Baseline",
  };

  if (keys.length === 0 || rows.length < 2) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
        {copy.noData}
      </div>
    );
  }

  const withYear = spansMultipleYears(rows.map((row) => String(row["date"])));
  const labelFor = (key: string) => keyLabels[key] ?? key;
  // Axis ticks stay bare — the unit is already named in the axis hint, and
  // spelling it out on every tick ("百分點") would eat the plot area.
  const formatTick = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
  const formatPp = (value: number) => `${formatTick(value)} ${copy.pointSuffix}`;

  return (
    <>
      <AxisHint x={copy.date} y={copy.shareChange} />
      <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-3 text-[11px]">
        {/* Naming the baseline date is what explains why every line starts at zero. */}
        <span>
          {copy.baseline} {formatShortDate(String(rows[0]?.["date"]), locale, timeZone)} = 0
        </span>
        {keys.map((key, i) => (
          <span key={key} className="inline-flex items-center gap-1">
            <span className="inline-block h-px w-5" style={{ backgroundColor: seriesColors[i] }} />
            {labelFor(key)}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={rows} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatShortDate(value, locale, timeZone, { year: withYear })}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value: number) => formatTick(value)}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            formatter={(v, name) => [formatPp(Number(v)), labelFor(String(name))]}
            labelFormatter={(label) =>
              formatShortDate(label as string, locale, timeZone, { year: withYear })
            }
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipLabelStyle}
          />
          {/* The baseline date sits at zero by construction — every series starts there. */}
          <ReferenceLine y={0} stroke={chartColors.trend} strokeDasharray="4 3" />
          {keys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={key}
              stroke={seriesColors[i]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
