"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AxisHint from "./axis-hint";
import {
  axisTick,
  barRadius,
  chartColors,
  compactChartMargin,
  formatCompactNumber,
  gridProps,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";

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
  const conversionLabel = labels?.conversionRate ?? "Rate from Views";
  const chartData = data.map((point) => ({
    ...point,
    label: getActionLabel(point.action, labels),
  }));

  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
        {labels?.noData ?? "No data"}
      </div>
    );
  }

  return (
    <>
      <AxisHint x={labels?.count ?? "Count"} y={labels?.action ?? "Action"} />
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={compactChartMargin}>
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
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as (typeof chartData)[number];
              return (
                <div
                  style={tooltipStyle}
                  className="border-border bg-popover text-popover-foreground rounded border px-2 py-1 text-xs shadow-sm"
                >
                  <p style={tooltipLabelStyle}>{point.label}</p>
                  <p>{point.value.toLocaleString()}</p>
                  {point.action !== "Views" && (
                    <p className="text-muted-foreground">
                      {conversionLabel}: {point.rate.toFixed(2)}%
                    </p>
                  )}
                </div>
              );
            }}
          />
          <Bar
            dataKey="value"
            fill={chartColors.engagement}
            fillOpacity={0.82}
            radius={barRadius}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
