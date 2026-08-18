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
  activeDot,
  axisTick,
  chartColors,
  seriesColors,
  compactChartMargin,
  formatShortDate,
  spansMultipleYears,
  gridProps,
  lineCursor,
} from "./chart-style";
import AxisHint from "./axis-hint";
import { ChartEmptyState, ChartLegend, ChartTooltip, useChartMotion } from "./chart-chrome";

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
  const motion = useChartMotion();
  const copy = labels ?? {
    date: "Date",
    shareChange: "Share change",
    noData: "No data",
    pointSuffix: "pp",
    baseline: "Baseline",
  };

  if (keys.length === 0 || rows.length < 2) {
    return <ChartEmptyState label={copy.noData} height={160} />;
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
      <div className="mb-2 flex flex-wrap items-center gap-x-3.5 gap-y-1">
        {/* Naming the baseline date is what explains why every line starts at zero. */}
        <span className="text-muted-foreground text-[11px] leading-4">
          {copy.baseline} {formatShortDate(String(rows[0]?.["date"]), locale, timeZone)} = 0
        </span>
        <ChartLegend
          items={keys.map((key, i) => ({
            label: labelFor(key),
            color: seriesColors[i] ?? seriesColors[0],
            shape: "line",
          }))}
        />
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
            cursor={lineCursor}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <ChartTooltip
                  title={formatShortDate(label as string, locale, timeZone, { year: withYear })}
                  rows={payload.map((entry) => ({
                    label: labelFor(String(entry.dataKey)),
                    value: formatPp(Number(entry.value)),
                    color: String(entry.stroke ?? entry.color ?? seriesColors[0]),
                  }))}
                />
              );
            }}
          />
          {/* The baseline date sits at zero by construction — every series starts there. */}
          <ReferenceLine y={0} stroke={chartColors.trend} strokeDasharray="4 3" />
          {keys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={key}
              stroke={seriesColors[i] ?? seriesColors[0]}
              strokeWidth={1.8}
              dot={false}
              activeDot={activeDot(seriesColors[i] ?? seriesColors[0])}
              {...motion}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
