"use client";

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import AxisHint from "./axis-hint";
import {
  chartColors,
  compactAxisTick,
  compactChartMargin,
  spansMultipleYears,
  gridProps,
  legendStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";
import {
  GranularityToggle,
  aggregateByGranularity,
  formatBucketLabel,
  formatBucketTooltipLabel,
  useGranularity,
} from "./granularity";

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
  );

  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
        {copy.noData}
      </div>
    );
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
            labelFormatter={(v) =>
              formatBucketTooltipLabel(String(v), granularity, locale, timeZone, {
                year: withYear,
              })
            }
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipLabelStyle}
          />
          <Legend iconType="line" iconSize={12} wrapperStyle={legendStyle} />
          <Line
            type="monotone"
            dataKey="likes"
            name={copy.likes}
            stroke={chartColors.likes}
            strokeWidth={1.8}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="replies"
            name={copy.replies}
            stroke={chartColors.reply}
            strokeWidth={1.8}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="reposts"
            name={copy.reposts}
            stroke={chartColors.repost}
            strokeWidth={1.8}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="quotes"
            name={copy.quotes}
            stroke={chartColors.quote}
            strokeWidth={1.8}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
