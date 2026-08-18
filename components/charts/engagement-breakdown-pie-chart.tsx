"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { chartColors, formatCompactNumber } from "./chart-style";
import { ChartEmptyState, ChartTooltip, useChartMotion } from "./chart-chrome";

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
  const motion = useChartMotion();

  if (!data.length || data.every((d) => d.value === 0)) {
    return <ChartEmptyState label={labels?.noData ?? "No data"} height={320} />;
  }

  const chartData = data.map((d) => ({
    ...d,
    name: getLabel(d.type, labels),
  }));
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="w-full">
      {/* Donut with the headline total resting in its center. */}
      <div className="relative mx-auto h-[220px] w-full max-w-[320px]">
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 320, height: 220 }}
        >
          <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="100%"
              innerRadius="76%"
              cornerRadius={6}
              paddingAngle={2.5}
              stroke="none"
              {...motion}
            >
              {chartData.map((entry) => (
                <Cell key={entry.type} fill={COLOR_MAP[entry.type]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0]?.payload as (typeof chartData)[number];
                return (
                  <ChartTooltip
                    title={point.name}
                    rows={[
                      {
                        label: `${point.rate.toFixed(1)}%`,
                        value: point.value.toLocaleString(),
                        color: COLOR_MAP[point.type],
                      },
                    ]}
                  />
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl leading-7 font-semibold tracking-[-0.02em] tabular-nums">
            {formatCompactNumber(total)}
          </p>
        </div>
      </div>

      {/* Value list beats a bare legend: name, count, and share per type. */}
      <div className="mx-auto mt-5 w-full max-w-[320px] space-y-1.5">
        {chartData.map((entry) => (
          <div key={entry.type} className="flex items-center gap-2.5 text-xs leading-5">
            <span
              aria-hidden
              className="inline-block size-2 shrink-0 rounded-full"
              style={{ backgroundColor: COLOR_MAP[entry.type] }}
            />
            <span className="text-muted-foreground min-w-0 flex-1 truncate">{entry.name}</span>
            <span className="text-foreground font-medium tabular-nums">
              {entry.value.toLocaleString()}
            </span>
            <span className="text-muted-foreground w-12 text-right tabular-nums">
              {entry.rate.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
