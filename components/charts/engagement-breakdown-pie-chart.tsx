"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  chartColors,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
  legendStyle,
} from "./chart-style";

interface DataPoint {
  type: "likes" | "replies" | "reposts" | "quotes" | "shares";
  value: number;
  rate: number;
}

interface Props {
  data: DataPoint[];
  labels?: {
    likes: string;
    replies: string;
    reposts: string;
    quotes: string;
    shares: string;
    noData?: string;
  };
}

const COLOR_MAP: Record<DataPoint["type"], string> = {
  likes: chartColors.likes,
  replies: chartColors.reply,
  reposts: chartColors.repost,
  quotes: chartColors.quote,
  shares: chartColors.share,
};

function getLabel(type: DataPoint["type"], labels?: Props["labels"]) {
  if (!labels) return type;
  if (type === "likes") return labels.likes;
  if (type === "replies") return labels.replies;
  if (type === "reposts") return labels.reposts;
  if (type === "quotes") return labels.quotes;
  return labels.shares;
}

export default function EngagementBreakdownPieChart({ data, labels }: Props) {
  if (!data.length || data.every((d) => d.value === 0)) {
    return (
      <div className="text-muted-foreground flex h-[320px] items-center justify-center text-sm sm:h-[380px]">
        {labels?.noData ?? "No data"}
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    name: getLabel(d.type, labels),
  }));

  return (
    <div className="h-[320px] w-full sm:h-[380px]">
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 320, height: 320 }}
      >
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="48%"
            outerRadius="82%"
            innerRadius="52%"
            strokeWidth={1}
            stroke="var(--background)"
          >
            {chartData.map((entry) => (
              <Cell key={entry.type} fill={COLOR_MAP[entry.type]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, name) => [Number(v).toLocaleString(), String(name)]}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as (typeof chartData)[number];
              return (
                <div
                  style={tooltipStyle}
                  className="border-border bg-popover text-popover-foreground rounded border px-2 py-1 text-xs shadow-sm"
                >
                  <p style={tooltipLabelStyle}>{point.name}</p>
                  <p>{point.value.toLocaleString()}</p>
                  <p className="text-muted-foreground">{point.rate.toFixed(1)}%</p>
                </div>
              );
            }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
