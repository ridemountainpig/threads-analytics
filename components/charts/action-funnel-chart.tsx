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
import { axisTick, barCursor, chartColors, formatCompactNumber, gridProps } from "./chart-style";
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

export default function ActionFunnelChart({ data, labels }: Props) {
  const motion = useChartMotion();
  const conversionLabel = labels?.conversionRate ?? "Rate from Views";
  const chartData = data.map((point) => ({
    ...point,
    label: getActionLabel(point.action, labels),
  }));

  if (!data.length) {
    return <ChartEmptyState label={labels?.noData ?? "No data"} height={220} />;
  }

  return (
    <>
      <AxisHint x={labels?.count ?? "Count"} y={labels?.action ?? "Action"} />
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 44, left: 0, bottom: 0 }}
        >
          <CartesianGrid {...gridProps} horizontal={false} vertical />
          <XAxis
            type="number"
            tickFormatter={formatCompactNumber}
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
                      label: labels?.count ?? "Count",
                      value: point.value.toLocaleString(),
                      color: chartColors.views,
                    },
                    ...(point.action !== "Views"
                      ? [
                          {
                            label: conversionLabel,
                            value: `${point.rate.toFixed(2)}%`,
                            muted: true,
                          },
                        ]
                      : []),
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="value"
            fill={chartColors.views}
            fillOpacity={0.8}
            radius={[0, 5, 5, 0]}
            maxBarSize={20}
            {...motion}
          >
            {/* Values sit at each bar's end, so the drop-off reads without hovering. */}
            <LabelList
              dataKey="value"
              position="right"
              offset={8}
              formatter={(value) => formatCompactNumber(Number(value ?? 0))}
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
