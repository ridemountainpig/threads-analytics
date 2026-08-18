"use client";

import {
  CartesianGrid,
  ComposedChart,
  Area,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  activeDot,
  axisTick,
  chartColors,
  compactChartMargin,
  formatShortDate,
  spansMultipleYears,
  gridProps,
  lineCursor,
} from "./chart-style";
import AxisHint from "./axis-hint";
import { ChartAreaGradient, ChartEmptyState, ChartTooltip, useChartMotion } from "./chart-chrome";

/** Wide enough for a spelled-out four-figure follower count. */
const Y_AXIS_WIDTH = 52;

interface FollowerTrendChartProps {
  data: Array<{ date: string; followers: number; change: number | null }>;
  dateLocale?: string;
  timeZone: string;
  labels?: {
    followers: string;
    dailyChange: string;
    date: string;
    noData: string;
  };
}

export default function FollowerTrendChart({
  data,
  dateLocale,
  timeZone,
  labels,
}: FollowerTrendChartProps) {
  const locale = dateLocale ?? "en-US";
  const motion = useChartMotion();
  const copy = labels ?? {
    followers: "Followers",
    dailyChange: "Daily Change",
    date: "Date",
    noData: "No data",
  };

  if (!data.length) {
    return <ChartEmptyState label={copy.noData} height={200} />;
  }

  const withYear = spansMultipleYears(data.map((point) => point.date));
  // The first point has no predecessor, so its change stays null rather than
  // being flattened to 0 — "unknown" and "gained nobody" are different claims.
  const chartData = data;

  // Follower counts rarely start near zero, so a zero-based axis would flatten
  // the line into a straight edge. Pad around the observed range instead.
  const counts = data.map((point) => point.followers);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const pad = Math.max(1, Math.round((max - min) * 0.15));

  const formatDate = (value: string) =>
    formatShortDate(value, locale, timeZone, { year: withYear });
  // Follower counts move by single digits against a four-figure total, so the
  // compact format would collapse every tick to the same "1.6k".
  const formatCount = (value: number) => Math.round(value).toLocaleString(locale);
  const sharedX = {
    dataKey: "date",
    tick: axisTick,
    tickLine: false,
    axisLine: false,
    interval: "preserveStartEnd" as const,
  };

  // The daily delta rides in the tooltip rather than in a second panel: it moves
  // by single digits, so a bar chart of it is a row of near-identical stubs, and
  // the padded y-axis already bends visibly on a day that lost followers.
  return (
    <>
      <AxisHint x={copy.date} y={copy.followers} />
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData} margin={compactChartMargin}>
          <ChartAreaGradient id="follower-trend-fill" color={chartColors.followers} />
          <CartesianGrid {...gridProps} />
          <XAxis {...sharedX} tickFormatter={formatDate} />
          <YAxis
            domain={[min - pad, max + pad]}
            tickFormatter={formatCount}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={Y_AXIS_WIDTH}
          />
          <Tooltip
            cursor={lineCursor}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as (typeof chartData)[number] | undefined;
              if (!point) return null;
              const change = point.change;
              return (
                <ChartTooltip
                  title={formatDate(label as string)}
                  rows={[
                    {
                      label: copy.followers,
                      value: point.followers.toLocaleString(locale),
                      color: chartColors.followers,
                    },
                    ...(change !== null
                      ? [
                          {
                            label: copy.dailyChange,
                            value: `${change > 0 ? "+" : ""}${change.toLocaleString(locale)}`,
                            muted: true,
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
            dataKey="followers"
            stroke="none"
            fill="url(#follower-trend-fill)"
            activeDot={false}
            tooltipType="none"
            {...motion}
          />
          <Line
            type="monotone"
            dataKey="followers"
            name={copy.followers}
            stroke={chartColors.followers}
            strokeWidth={2}
            dot={false}
            activeDot={activeDot(chartColors.followers)}
            {...motion}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
