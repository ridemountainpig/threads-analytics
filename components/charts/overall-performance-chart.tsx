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
  formatShortDate,
  gridProps,
  legendStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";
import AxisHint from "./axis-hint";

interface DataPoint {
  date: string;
  views: number;
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
  labels?: {
    views: string;
    avgViewsPost: string;
    posts: string;
    date?: string;
    noData?: string;
  };
}

export default function OverallPerformanceChart({ data, dateLocale, labels }: Props) {
  const copy = labels ?? {
    views: "Views",
    avgViewsPost: "Avg Views / Post",
    posts: "Posts",
    noData: "No data",
  };

  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-[280px] items-center justify-center text-sm">
        {copy.noData}
      </div>
    );
  }

  return (
    <>
      <AxisHint
        x={copy.date ?? "Date"}
        y={`${copy.views} / ${copy.avgViewsPost} / ${copy.posts}`}
      />
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={chartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatShortDate(value, dateLocale)}
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
            labelFormatter={(v) => formatShortDate(String(v), dateLocale)}
            formatter={(value, name) => {
              const n = Number(value);
              if (name === copy.posts) return [n.toLocaleString(), name];
              return [n.toLocaleString(), name];
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
