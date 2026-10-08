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
  postsAxisDomain,
} from "./chart-style";
import {
  GranularityToggle,
  aggregateByGranularity,
  formatBucketLabel,
  formatBucketTooltipLabel,
  isPartialBucket,
  useGranularity,
} from "./granularity";
import AxisHint from "./axis-hint";
import {
  ChartAreaGradient,
  ChartEmptyState,
  ChartLegend,
  ChartTooltip,
  seriesDot,
  useChartMotion,
} from "./chart-chrome";

// One blue family: the post share is the deep fill, the rest a light tint under the same line.
const SPLIT_POST_COLOR = chartColors.views;
const SPLIT_OTHER_COLOR = chartColors.views;
const SPLIT_OTHER_LEGEND = `color-mix(in oklch, ${chartColors.views} 60%, var(--background))`;

interface DataPoint {
  date: string;
  views: number;
  postViews?: number;
  /** Rough share of `views` from the account's own posts; absent without account insights. */
  estimatedPostViews?: number;
  otherViews?: number;
  postCount: number;
  avgViewsPerPost: number;
  engagementRate: number;
  rollingEngagementRate: number;
  shareRate: number;
  shares: number;
  partial?: boolean;
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
    granularityGroup?: string;
    granularityWeek?: string;
    granularityMonth?: string;
    partialBucket?: string;
    postViewsEstimated?: string;
    otherViews?: string;
    postViewsShare?: string;
  };
}

function aggregatePoints(items: DataPoint[], bucket: string): DataPoint & { days: number } {
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
  const hasSplit = items.some((item) => item.estimatedPostViews !== undefined);

  return {
    date: bucket,
    views,
    postViews,
    ...(hasSplit
      ? {
          estimatedPostViews: items.reduce((sum, item) => sum + (item.estimatedPostViews ?? 0), 0),
          otherViews: items.reduce((sum, item) => sum + (item.otherViews ?? 0), 0),
        }
      : {}),
    postCount,
    avgViewsPerPost: postCount > 0 ? Math.round(postViews / postCount) : 0,
    engagementRate,
    rollingEngagementRate: engagementRate,
    shareRate: weightedRate((item) => item.shareRate),
    shares,
    days: items.length,
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
    group: copy.granularityGroup,
    week: copy.granularityWeek ?? "Week",
    month: copy.granularityMonth ?? "Month",
  };

  const { granularity, setGranularity, showToggle } = useGranularity(
    data.map((point) => point.date),
    timeZone,
    "overall-performance",
  );

  // Days without posts are zero-filled, so an all-zero series is still empty.
  if (!data.some((point) => point.views > 0 || point.postCount > 0)) {
    return <ChartEmptyState label={copy.noData} height={280} />;
  }

  const series = (
    granularity === "day"
      ? data.map((point) => ({ ...point, days: 1 }))
      : aggregateByGranularity(data, granularity, timeZone, (point) => point.date, aggregatePoints)
  ).map((point) => ({
    ...point,
    partial: isPartialBucket(point.date, granularity, timeZone, point.days),
  }));

  const withYear = spansMultipleYears(series.map((point) => point.date));
  const hasSplit = data.some((point) => point.estimatedPostViews !== undefined);
  const totalViews = data.reduce((sum, point) => sum + point.views, 0);
  const postShare =
    hasSplit && totalViews > 0
      ? Math.round(
          (data.reduce((sum, point) => sum + (point.estimatedPostViews ?? 0), 0) / totalViews) *
            100,
        )
      : null;
  const postViewsLabel = copy.postViewsEstimated ?? "From posts (est.)";
  const otherViewsLabel = copy.otherViews ?? "Other sources";
  const sharePct = (part: number | undefined, whole: number) =>
    part !== undefined && whole > 0 ? ` · ${Math.round((part / whole) * 100)}%` : "";

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <AxisHint x={copy.date ?? "Date"} y={copy.views} />
        {showToggle && (
          <GranularityToggle
            value={granularity}
            onChange={setGranularity}
            labels={granularityLabels}
          />
        )}
      </div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <ChartLegend
          items={[
            { label: copy.views, color: chartColors.views, shape: "line" },
            ...(hasSplit
              ? [
                  { label: postViewsLabel, color: SPLIT_POST_COLOR, shape: "dot" as const },
                  { label: otherViewsLabel, color: SPLIT_OTHER_LEGEND, shape: "dot" as const },
                ]
              : []),
            { label: copy.posts, color: chartColors.volume, shape: "dot" },
          ]}
        />
        {postShare !== null && (
          <p className="text-muted-foreground text-[11px] leading-4 tabular-nums">
            {(copy.postViewsShare ?? "~{pct}% from posts and thread parts").replace(
              "{pct}",
              String(postShare),
            )}
          </p>
        )}
      </div>
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
          {/* mirror keeps this hidden axis from pushing the visible ticks off-canvas. */}
          <YAxis yAxisId="posts" hide mirror domain={postsAxisDomain} />
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
                  subtitle={point.partial ? copy.partialBucket : undefined}
                  rows={[
                    {
                      label: copy.views,
                      value: point.views.toLocaleString(locale),
                      color: chartColors.views,
                    },
                    ...(point.estimatedPostViews !== undefined
                      ? [
                          {
                            label: postViewsLabel,
                            value: `${point.estimatedPostViews.toLocaleString(locale)}${sharePct(point.estimatedPostViews, point.views)}`,
                            color: SPLIT_POST_COLOR,
                          },
                          {
                            label: otherViewsLabel,
                            value: `${(point.otherViews ?? 0).toLocaleString(locale)}${sharePct(point.otherViews, point.views)}`,
                            color: SPLIT_OTHER_LEGEND,
                          },
                        ]
                      : []),
                    {
                      label: copy.posts,
                      value: point.postCount.toLocaleString(locale),
                      muted: true,
                    },
                    {
                      label: copy.avgViewsPost,
                      value: point.avgViewsPerPost.toLocaleString(locale),
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
            fill={chartColors.volume}
            radius={barRadius}
            maxBarSize={12}
            {...motion}
          />
          {hasSplit ? (
            <>
              <Area
                yAxisId="views"
                type="monotone"
                dataKey="estimatedPostViews"
                stackId="split"
                stroke="none"
                fill={SPLIT_POST_COLOR}
                fillOpacity={0.5}
                activeDot={false}
                tooltipType="none"
                {...motion}
              />
              <Area
                yAxisId="views"
                type="monotone"
                dataKey="otherViews"
                stackId="split"
                stroke="none"
                fill={SPLIT_OTHER_COLOR}
                fillOpacity={0.18}
                activeDot={false}
                tooltipType="none"
                {...motion}
              />
            </>
          ) : (
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
          )}
          <Line
            yAxisId="views"
            type="monotone"
            dataKey="views"
            name={copy.views}
            stroke={chartColors.views}
            strokeWidth={2}
            dot={seriesDot(chartColors.views, series.length)}
            activeDot={activeDot(chartColors.views)}
            {...motion}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
