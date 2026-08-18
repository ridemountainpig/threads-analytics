"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  activeDot,
  barRadius,
  chartColors,
  chartMargin,
  compactAxisTick,
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
  useGranularity,
} from "./granularity";
import AxisHint from "./axis-hint";
import {
  ChartAreaGradient,
  ChartEmptyState,
  ChartLegend,
  ChartTooltip,
  useChartMotion,
} from "./chart-chrome";

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
  const motion = useChartMotion();
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
    return <ChartEmptyState label={copy.noData} height={280} />;
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
      <ChartLegend
        className="mb-2"
        items={[
          { label: copy.views, color: chartColors.views, shape: "line" },
          { label: copy.avgViewsPost, color: chartColors.avgViews, shape: "dash" },
          { label: copy.posts, color: chartColors.bar, shape: "dot" },
        ]}
      />
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={series} margin={chartMargin}>
          <ChartAreaGradient id="overall-performance-fill" color={chartColors.views} />
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
            cursor={lineCursor}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as DataPoint;
              return (
                <ChartTooltip
                  title={formatBucketTooltipLabel(String(label), granularity, locale, timeZone, {
                    year: withYear,
                  })}
                  rows={[
                    {
                      label: copy.views,
                      value: point.views.toLocaleString(locale),
                      color: chartColors.views,
                    },
                    {
                      label: copy.avgViewsPost,
                      value: point.avgViewsPerPost.toLocaleString(locale),
                      color: chartColors.avgViews,
                    },
                    {
                      label: copy.posts,
                      value: point.postCount.toLocaleString(locale),
                      muted: true,
                    },
                  ]}
                />
              );
            }}
          />
          <Bar
            yAxisId="posts"
            dataKey="postCount"
            name={copy.posts}
            fill={chartColors.bar}
            radius={barRadius}
            maxBarSize={18}
            {...motion}
          />
          <Area
            yAxisId="views"
            type="monotone"
            dataKey="views"
            stroke="none"
            fill="url(#overall-performance-fill)"
            activeDot={false}
            tooltipType="none"
            {...motion}
          />
          <Line
            yAxisId="views"
            type="monotone"
            dataKey="views"
            name={copy.views}
            stroke={chartColors.views}
            strokeWidth={2}
            dot={false}
            activeDot={activeDot(chartColors.views)}
            {...motion}
          />
          <Line
            yAxisId="views"
            type="monotone"
            dataKey="avgViewsPerPost"
            name={copy.avgViewsPost}
            stroke={chartColors.avgViews}
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 3"
            activeDot={activeDot(chartColors.avgViews)}
            {...motion}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
