"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AxisHint from "./axis-hint";
import {
  axisTick,
  barCursor,
  chartColors,
  formatCompactNumber,
  gridProps,
  rateTicks,
} from "./chart-style";
import { ChartEmptyState, ChartTooltip, useChartMotion } from "./chart-chrome";

interface DataPoint {
  word: string;
  postCount: number;
  avgViews: number;
  avgEngagementRate: number;
  avgShareRate: number;
}

interface Props {
  data: DataPoint[];
  labels?: {
    posts: string;
    avgViews: string;
    engagementRate: string;
    shareRate: string;
    keyword?: string;
    viewsUnit?: string;
    noData?: string;
  };
}

const MAX_LABEL_CHARS = 10;
const ROW_HEIGHT = 26;

function truncate(word: string) {
  const chars = Array.from(word);
  return chars.length > MAX_LABEL_CHARS ? `${chars.slice(0, MAX_LABEL_CHARS - 1).join("")}…` : word;
}

// Ranked by engagement rate, so the rate is the bar; views ride along in the label.
export default function KeywordAnalysisChart({ data, labels }: Props) {
  const motion = useChartMotion();
  const copy = labels ?? {
    posts: "Posts",
    avgViews: "Avg Views",
    engagementRate: "Engagement Rate",
    shareRate: "Share Rate",
    noData: "No data",
  };

  if (!data.length) {
    return <ChartEmptyState label={copy.noData ?? "No data"} height={220} />;
  }

  const ticks = rateTicks(Math.max(...data.map((point) => point.avgEngagementRate)));
  const chartData = data.map((point) => ({
    ...point,
    label: truncate(point.word),
    display: `${point.avgEngagementRate.toFixed(2)}% · ${formatCompactNumber(point.avgViews)} ${copy.viewsUnit ?? "views"}`,
  }));

  return (
    <>
      <AxisHint x={copy.engagementRate} y={copy.keyword ?? "Keyword"} />
      <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * ROW_HEIGHT + 32)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 116, left: 0, bottom: 0 }}
        >
          <CartesianGrid {...gridProps} horizontal={false} vertical />
          <XAxis
            type="number"
            domain={[0, ticks[ticks.length - 1] ?? 1]}
            ticks={ticks}
            tickFormatter={(value: number) => `${Number(value.toFixed(2))}%`}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            interval={0}
            width={96}
          />
          <Tooltip
            cursor={barCursor}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as (typeof chartData)[number];
              return (
                <ChartTooltip
                  title={point.word}
                  rows={[
                    {
                      label: copy.engagementRate,
                      value: `${point.avgEngagementRate.toFixed(2)}%`,
                      color: chartColors.engagement,
                    },
                    { label: copy.avgViews, value: point.avgViews.toLocaleString() },
                    { label: copy.shareRate, value: `${point.avgShareRate.toFixed(2)}%` },
                    { label: copy.posts, value: point.postCount.toLocaleString(), muted: true },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="avgEngagementRate"
            fill={chartColors.engagement}
            fillOpacity={0.8}
            radius={[0, 5, 5, 0]}
            maxBarSize={16}
            {...motion}
          >
            <LabelList
              dataKey="display"
              position="right"
              offset={8}
              style={{
                fill: "var(--muted-foreground)",
                fontSize: 10,
                fontVariantNumeric: "tabular-nums",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
