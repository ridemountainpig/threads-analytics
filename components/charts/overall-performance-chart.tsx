"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  barRadius,
  chartColors,
  chartMargin,
  compactAxisTick,
  formatCompactNumber,
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
import AxisHint from "./axis-hint";

interface DataPoint {
  date: string;
  views: number;
  postViews?: number;
  postCount: number;
  avgViewsPerPost: number;
  engagementRate: number;
  rollingEngagementRate: number;
  shareRate: number;
  shares: number;
}

interface Props {
  data: DataPoint[];
  dateLocale?: string;
  timeZone: string;
  labels?: {
    views: string;
    avgViewsPost: string;
    posts: string;
    date?: string;
    noData?: string;
    granularityDay?: string;
    granularityWeek?: string;
    granularityMonth?: string;
  };
}

function aggregatePoints(items: DataPoint[], bucket: string): DataPoint {
  const views = items.reduce((sum, item) => sum + item.views, 0);
  const postCount = items.reduce((sum, item) => sum + item.postCount, 0);
  const shares = items.reduce((sum, item) => sum + item.shares, 0);
  const postViews = items.reduce(
    (sum, item) => sum + (item.postViews ?? item.avgViewsPerPost * item.postCount),
    0,
  );
  const weightedRate = (rate: (item: DataPoint) => number) =>
    views > 0
      ? Math.round((items.reduce((sum, item) => sum + rate(item) * item.views, 0) / views) * 100) /
        100
      : 0;
  const engagementRate = weightedRate((item) => item.engagementRate);

  return {
    date: bucket,
    views,
    postViews,
    postCount,
    avgViewsPerPost: postCount > 0 ? Math.round(postViews / postCount) : 0,
    engagementRate,
    rollingEngagementRate: engagementRate,
    shareRate: weightedRate((item) => item.shareRate),
    shares,
  };
}

export default function OverallPerformanceChart({ data, dateLocale, timeZone, labels }: Props) {
  const locale = dateLocale ?? "en-US";
  const copy = labels ?? {
    views: "Views",
    avgViewsPost: "Avg Views / Post",
    posts: "Posts",
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
    "overall-performance",
  );

  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-[280px] items-center justify-center text-sm">
        {copy.noData}
      </div>
    );
  }

  const series =
    granularity === "day"
      ? data
      : aggregateByGranularity(data, granularity, timeZone, (point) => point.date, aggregatePoints);

  const withYear = spansMultipleYears(series.map((point) => point.date));

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <AxisHint
          x={copy.date ?? "Date"}
          y={`${copy.views} / ${copy.avgViewsPost} / ${copy.posts}`}
        />
        {showToggle && (
          <GranularityToggle
            value={granularity}
            onChange={setGranularity}
            labels={granularityLabels}
          />
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={series} margin={chartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) =>
              formatBucketLabel(String(value), granularity, locale, timeZone, { year: withYear })
            }
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="views"
            tickFormatter={formatCompactNumber}
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
            width={42}
          />
          <YAxis yAxisId="posts" hide domain={[0, "dataMax + 1"]} />
          <Tooltip
            labelFormatter={(v) =>
              formatBucketTooltipLabel(String(v), granularity, locale, timeZone, {
                year: withYear,
              })
            }
            formatter={(value, name) => {
              const n = Number(value);
              if (name === copy.posts) return [n.toLocaleString(locale), name];
              return [n.toLocaleString(locale), name];
            }}
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipLabelStyle}
          />
          <Legend iconSize={10} wrapperStyle={legendStyle} />
          <Bar
            yAxisId="posts"
            dataKey="postCount"
            name={copy.posts}
            fill={chartColors.bar}
            radius={barRadius}
            maxBarSize={22}
          />
          <Line
            yAxisId="views"
            type="monotone"
            dataKey="views"
            name={copy.views}
            stroke={chartColors.views}
            strokeWidth={1.8}
            dot={false}
          />
          <Line
            yAxisId="views"
            type="monotone"
            dataKey="avgViewsPerPost"
            name={copy.avgViewsPost}
            stroke={chartColors.avgViews}
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
