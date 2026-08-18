"use client";

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AxisHint from "./axis-hint";
import {
  activeDot,
  chartColors,
  compactAxisTick,
  compactChartMargin,
  spansMultipleYears,
  gridProps,
  lineCursor,
} from "./chart-style";
import {
  GranularityToggle,
  aggregateByGranularity,
  formatBucketLabel,
  formatBucketTooltipLabel,
  useGranularity,
} from "./granularity";
import { ChartEmptyState, ChartLegend, ChartTooltip, useChartMotion } from "./chart-chrome";

interface DataPoint {
  date: string;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
}

interface Props {
  data: DataPoint[];
  dateLocale?: string;
  timeZone: string;
  labels?: {
    likes: string;
    replies: string;
    reposts: string;
    quotes: string;
    date?: string;
    interactions?: string;
    noData?: string;
    granularityDay?: string;
    granularityWeek?: string;
    granularityMonth?: string;
  };
}

export default function EngagementBreakdownChart({ data, dateLocale, timeZone, labels }: Props) {
  const locale = dateLocale ?? "en-US";
  const motion = useChartMotion();
  const copy = labels ?? {
    likes: "Likes",
    replies: "Replies",
    reposts: "Reposts",
    quotes: "Quotes",
    noData: "No data",
  };
  const granularityLabels = {
    day: copy.granularityDay ?? "Day",
    week: copy.granularityWeek ?? "Week",
    month: copy.granularityMonth ?? "Month",
  };

  const { granularity, setGranularity, showToggle } = useGranularity(
    data.map((point) => point.date),
    timeZone,
    "engagement-breakdown",
  );

  if (!data.length) {
    return <ChartEmptyState label={copy.noData} height={200} />;
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
            likes: items.reduce((sum, item) => sum + item.likes, 0),
            replies: items.reduce((sum, item) => sum + item.replies, 0),
            reposts: items.reduce((sum, item) => sum + item.reposts, 0),
            quotes: items.reduce((sum, item) => sum + item.quotes, 0),
          }),
        );

  const withYear = spansMultipleYears(series.map((point) => point.date));

  const seriesMeta = [
    { key: "likes" as const, label: copy.likes, color: chartColors.likes },
    { key: "replies" as const, label: copy.replies, color: chartColors.reply },
    { key: "reposts" as const, label: copy.reposts, color: chartColors.repost },
    { key: "quotes" as const, label: copy.quotes, color: chartColors.quote },
  ];

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <AxisHint x={copy.date ?? "Date"} y={copy.interactions ?? "Interactions"} />
        {showToggle && (
          <GranularityToggle
            value={granularity}
            onChange={setGranularity}
            labels={granularityLabels}
          />
        )}
      </div>
      <ChartLegend
        className="mb-2"
        items={seriesMeta.map((meta) => ({ label: meta.label, color: meta.color, shape: "line" }))}
      />
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={series} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) =>
              formatBucketLabel(String(value), granularity, locale, timeZone, { year: withYear })
            }
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={compactAxisTick} tickLine={false} axisLine={false} width={34} />
          <Tooltip
            cursor={lineCursor}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as DataPoint;
              return (
                <ChartTooltip
                  title={formatBucketTooltipLabel(String(label), granularity, locale, timeZone, {
                    year: withYear,
                  })}
                  rows={seriesMeta.map((meta) => ({
                    label: meta.label,
                    value: point[meta.key].toLocaleString(locale),
                    color: meta.color,
                  }))}
                />
              );
            }}
          />
          {seriesMeta.map((meta) => (
            <Line
              key={meta.key}
              type="monotone"
              dataKey={meta.key}
              name={meta.label}
              stroke={meta.color}
              strokeWidth={1.8}
              dot={false}
              activeDot={activeDot(meta.color)}
              {...motion}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
