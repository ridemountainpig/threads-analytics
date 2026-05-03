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
  formatShortDate,
  gridProps,
  legendStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";

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
  labels?: {
    likes: string;
    replies: string;
    reposts: string;
    quotes: string;
    date?: string;
    interactions?: string;
  };
}

export default function EngagementBreakdownChart({ data, dateLocale, labels }: Props) {
  const copy = labels ?? {
    likes: "Likes",
    replies: "Replies",
    reposts: "Reposts",
    quotes: "Quotes",
  };

  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
        No data
      </div>
    );
  }

  return (
    <>
      <AxisHint x={copy.date ?? "Date"} y={copy.interactions ?? "Interactions"} />
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatShortDate(value, dateLocale)}
            tick={compactAxisTick}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={compactAxisTick} tickLine={false} axisLine={false} width={34} />
          <Tooltip
            labelFormatter={(v) => formatShortDate(String(v), dateLocale)}
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
