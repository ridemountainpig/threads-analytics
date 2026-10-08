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
  formatCompactNumber,
  spansMultipleYears,
  gridProps,
  lineCursor,
} from "./chart-style";
import {
  GranularityToggle,
  aggregateByGranularity,
  formatBucketLabel,
  formatBucketTooltipLabel,
  isPartialBucket,
  useGranularity,
} from "./granularity";
import { ChartEmptyState, ChartTooltip, seriesDot, useChartMotion } from "./chart-chrome";

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
    granularityGroup?: string;
    granularityWeek?: string;
    granularityMonth?: string;
    partialBucket?: string;
  };
}

type SeriesKey = "likes" | "replies" | "reposts" | "quotes";

// One chart per type: on a shared axis, likes flatten the other three.
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
    group: copy.granularityGroup,
    week: copy.granularityWeek ?? "Week",
    month: copy.granularityMonth ?? "Month",
  };

  const { granularity, setGranularity, showToggle } = useGranularity(
    data.map((point) => point.date),
    timeZone,
    "engagement-breakdown",
  );

  // Days without posts are zero-filled, so an all-zero series is still empty.
  if (!data.some((point) => point.likes + point.replies + point.reposts + point.quotes > 0)) {
    return <ChartEmptyState label={copy.noData} height={200} />;
  }

  const series = (
    granularity === "day"
      ? data.map((point) => ({ ...point, days: 1 }))
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
            days: items.length,
          }),
        )
  ).map((point) => ({
    ...point,
    partial: isPartialBucket(point.date, granularity, timeZone, point.days),
  }));

  const withYear = spansMultipleYears(series.map((point) => point.date));
  const formatTick = (value: unknown) =>
    formatBucketLabel(String(value), granularity, locale, timeZone, { year: withYear });

  const seriesMeta: Array<{ key: SeriesKey; label: string; color: string }> = [
    { key: "likes", label: copy.likes, color: chartColors.likes },
    { key: "replies", label: copy.replies, color: chartColors.reply },
    { key: "reposts", label: copy.reposts, color: chartColors.repost },
    { key: "quotes", label: copy.quotes, color: chartColors.quote },
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
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {seriesMeta.map((meta) => {
          const total = series.reduce((sum, point) => sum + point[meta.key], 0);
          return (
            <div key={meta.key} className="min-w-0">
              <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px] leading-4">
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  {meta.label}
                </span>
                <span className="text-foreground font-medium tabular-nums">
                  {total.toLocaleString(locale)}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={series} margin={compactChartMargin}>
                  <CartesianGrid {...gridProps} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatTick}
                    tick={compactAxisTick}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickFormatter={formatCompactNumber}
                    tick={compactAxisTick}
                    tickLine={false}
                    axisLine={false}
                    tickCount={3}
                    width={40}
                  />
                  <Tooltip
                    cursor={lineCursor}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const point = payload[0]?.payload as (typeof series)[number];
                      return (
                        <ChartTooltip
                          title={formatBucketTooltipLabel(
                            String(label),
                            granularity,
                            locale,
                            timeZone,
                            { year: withYear },
                          )}
                          subtitle={point.partial ? copy.partialBucket : undefined}
                          rows={[
                            {
                              label: meta.label,
                              value: point[meta.key].toLocaleString(locale),
                              color: meta.color,
                            },
                          ]}
                        />
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={meta.key}
                    name={meta.label}
                    stroke={meta.color}
                    strokeWidth={1.6}
                    dot={seriesDot(meta.color, series.length)}
                    activeDot={activeDot(meta.color)}
                    {...motion}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </>
  );
}
