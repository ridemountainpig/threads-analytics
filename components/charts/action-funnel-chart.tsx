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
  action: "Views" | "Likes" | "Replies" | "Reposts" | "Quotes" | "Shares";
  value: number;
  rate: number;
}

interface Props {
  data: DataPoint[];
  labels?: {
    views: string;
    likes: string;
    replies: string;
    reposts: string;
    quotes: string;
    shares: string;
    action?: string;
    count?: string;
    conversionRate?: string;
    viewsTotal?: string;
    noData?: string;
  };
}

function getActionLabel(action: DataPoint["action"], labels?: Props["labels"]) {
  if (!labels) return action;
  if (action === "Views") return labels.views;
  if (action === "Likes") return labels.likes;
  if (action === "Replies") return labels.replies;
  if (action === "Reposts") return labels.reposts;
  if (action === "Quotes") return labels.quotes;
  return labels.shares;
}

function formatRate(rate: number) {
  return `${rate.toFixed(2)}%`;
}

export default function ActionFunnelChart({ data, labels }: Props) {
  const motion = useChartMotion();
  const conversionLabel = labels?.conversionRate ?? "Rate from Views";
  const views = data.find((point) => point.action === "Views")?.value ?? 0;
  const chartData = data
    .filter((point) => point.action !== "Views")
    .map((point) => ({
      ...point,
      label: getActionLabel(point.action, labels),
      display: `${formatRate(point.rate)} · ${formatCompactNumber(point.value)}`,
    }));

  if (!chartData.length || views <= 0) {
    return <ChartEmptyState label={labels?.noData ?? "No data"} height={220} />;
  }
  const ticks = rateTicks(Math.max(...chartData.map((point) => point.rate)));

  return (
    <>
      <AxisHint x={conversionLabel} y={labels?.action ?? "Action"} />
      <p className="text-muted-foreground mb-2 text-[11px] leading-4 tabular-nums">
        {(labels?.viewsTotal ?? "{views} total views").replace("{views}", views.toLocaleString())}
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 88, left: 0, bottom: 0 }}
        >
          <CartesianGrid {...gridProps} horizontal={false} vertical />
          <XAxis
            type="number"
            domain={[0, ticks[ticks.length - 1]]}
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
            width={72}
          />
          <Tooltip
            cursor={barCursor}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as (typeof chartData)[number];
              return (
                <ChartTooltip
                  title={point.label}
                  rows={[
                    {
                      label: conversionLabel,
                      value: formatRate(point.rate),
                      color: chartColors.views,
                    },
                    {
                      label: labels?.count ?? "Count",
                      value: point.value.toLocaleString(),
                      muted: true,
                    },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="rate"
            fill={chartColors.views}
            fillOpacity={0.8}
            radius={[0, 5, 5, 0]}
            maxBarSize={22}
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
