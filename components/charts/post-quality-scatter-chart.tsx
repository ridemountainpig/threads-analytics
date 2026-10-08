"use client";

import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import AxisHint from "./axis-hint";
import {
  axisTick,
  chartColors,
  chartPalette,
  compactChartMargin,
  formatCompactNumber,
  gridProps,
} from "./chart-style";
import { ChartEmptyState, ChartLegend, ChartTooltip, useChartMotion } from "./chart-chrome";

interface DataPoint {
  id: string;
  text: string;
  mediaType: string;
  permalink: string;
  views: number;
  engagementRate: number;
  replyRate: number;
  shareRate: number;
  shares: number;
  textLength: number;
  viewsMultiplier: number;
  quadrant: "breakout" | "conversation" | "broadcast" | "underperforming";
}

interface Props {
  data: DataPoint[];
  /** The medians that split the quadrants, drawn as guide lines. */
  thresholds?: { medianViews: number; medianEngagementRate: number };
  labels?: {
    views: string;
    engagementRate: string;
    replyRate: string;
    shareRate: string;
    shares: string;
    dotSizeShares?: string;
    textLength?: string;
    viewsMultiplier?: string;
    quadrantBreakout?: string;
    quadrantConversation?: string;
    quadrantBroadcast?: string;
    quadrantUnderperforming?: string;
    quadrantGroup?: string;
    mediaTypes?: Record<string, string>;
    noData?: string;
    noText?: string;
    medianGuides?: string;
  };
}

// Winners get color; underperformers recede to gray rather than shouting
// in a warning hue.
const QUADRANT_COLORS: Record<DataPoint["quadrant"], string> = {
  breakout: chartColors.engagement,
  conversation: chartColors.quote,
  broadcast: chartColors.views,
  underperforming: chartPalette.slate,
};

const QUADRANT_OPACITY: Record<DataPoint["quadrant"], number> = {
  breakout: 0.85,
  conversation: 0.8,
  broadcast: 0.8,
  underperforming: 0.35,
};

function getQuadrantLabel(quadrant: DataPoint["quadrant"], labels?: Props["labels"]) {
  const fallback = {
    breakout: "Breakout",
    conversation: "Conversation",
    broadcast: "Broadcast",
    underperforming: "Underperforming",
  };

  if (quadrant === "breakout") return labels?.quadrantBreakout ?? fallback.breakout;
  if (quadrant === "conversation") return labels?.quadrantConversation ?? fallback.conversation;
  if (quadrant === "broadcast") return labels?.quadrantBroadcast ?? fallback.broadcast;
  return labels?.quadrantUnderperforming ?? fallback.underperforming;
}

// Powers of ten across the data, with 3x steps added when the span is narrow.
function logTicks(min: number, max: number): number[] {
  const low = Math.floor(Math.log10(Math.max(min, 1)));
  const high = Math.ceil(Math.log10(Math.max(max, 1)));
  const ticks: number[] = [];
  for (let exp = low; exp <= high; exp++) {
    ticks.push(10 ** exp);
    if (high - low <= 2 && exp < high) ticks.push(3 * 10 ** exp);
  }
  return ticks.filter((tick) => tick >= 1);
}

function truncateText(text: string, noText?: string) {
  return text.length > 96 ? `${text.slice(0, 96)}...` : text || (noText ?? "(no text)");
}

export default function PostQualityScatterChart({ data, thresholds, labels }: Props) {
  const motion = useChartMotion();
  const copy = labels ?? {
    views: "Views",
    engagementRate: "Engagement Rate",
    replyRate: "Reply Rate",
    shareRate: "Share Rate",
    shares: "Shares",
    textLength: "Text Length",
    viewsMultiplier: "Views vs Median",
    noData: "No data",
  };

  if (!data.length) {
    return <ChartEmptyState label={copy.noData} height={280} />;
  }

  const getMediaTypeLabel = (mediaType: string) => labels?.mediaTypes?.[mediaType] ?? mediaType;
  const quadrants = ["breakout", "conversation", "broadcast", "underperforming"] as const;
  // Views are long-tailed, so a linear axis would pile most posts against zero.
  const viewValues = data.map((point) => point.views);
  const xTicks = logTicks(Math.min(...viewValues), Math.max(...viewValues));
  const xDomain: [number, number] = [xTicks[0] ?? 1, xTicks[xTicks.length - 1] ?? 10];

  return (
    <>
      <AxisHint
        x={copy.views}
        y={copy.engagementRate}
        size={copy.dotSizeShares ?? copy.shares}
        color={copy.quadrantGroup ?? "Quadrant"}
      />
      <ChartLegend
        className="mb-2"
        items={[
          ...quadrants.map((quadrant) => ({
            label: getQuadrantLabel(quadrant, labels),
            color: QUADRANT_COLORS[quadrant],
            shape: "dot" as const,
          })),
          ...(thresholds
            ? [
                {
                  label: labels?.medianGuides ?? "Dashed lines: your medians",
                  color: chartColors.trend,
                  shape: "dash" as const,
                },
              ]
            : []),
        ]}
      />
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            type="number"
            dataKey="views"
            name={copy.views}
            scale="log"
            domain={xDomain}
            ticks={xTicks}
            allowDataOverflow
            tickFormatter={formatCompactNumber}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <YAxis
            type="number"
            dataKey="engagementRate"
            name={copy.engagementRate}
            tickFormatter={(value: number) => `${value.toFixed(1)}%`}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={46}
          />
          <ZAxis type="number" dataKey="shares" range={[48, 260]} />
          <Tooltip
            cursor={{
              stroke: "color-mix(in oklch, var(--muted-foreground) 35%, transparent)",
              strokeDasharray: "3 3",
            }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as DataPoint;
              return (
                <ChartTooltip
                  title={truncateText(point.text, copy.noText)}
                  subtitle={`${getMediaTypeLabel(point.mediaType)} · ${getQuadrantLabel(point.quadrant, labels)}`}
                  rows={[
                    {
                      label: copy.views,
                      value: point.views.toLocaleString(),
                      color: QUADRANT_COLORS[point.quadrant],
                    },
                    { label: copy.engagementRate, value: `${point.engagementRate.toFixed(2)}%` },
                    { label: copy.replyRate, value: `${point.replyRate.toFixed(2)}%` },
                    { label: copy.shareRate, value: `${point.shareRate.toFixed(2)}%` },
                    { label: copy.shares, value: point.shares.toLocaleString() },
                    {
                      label: copy.viewsMultiplier ?? "Views vs Median",
                      value: `${point.viewsMultiplier}x`,
                      muted: true,
                    },
                    {
                      label: copy.textLength ?? "Text Length",
                      value: point.textLength.toLocaleString(),
                      muted: true,
                    },
                  ]}
                />
              );
            }}
          />
          {thresholds && thresholds.medianViews > 0 && (
            <ReferenceLine
              x={thresholds.medianViews}
              stroke={chartColors.trend}
              strokeDasharray="4 3"
              strokeOpacity={0.7}
            />
          )}
          {thresholds && (
            <ReferenceLine
              y={thresholds.medianEngagementRate}
              stroke={chartColors.trend}
              strokeDasharray="4 3"
              strokeOpacity={0.7}
            />
          )}
          {quadrants.map((quadrant) => (
            <Scatter
              key={quadrant}
              name={getQuadrantLabel(quadrant, labels)}
              data={data.filter((point) => point.quadrant === quadrant)}
              fill={QUADRANT_COLORS[quadrant]}
              fillOpacity={QUADRANT_OPACITY[quadrant]}
              {...motion}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </>
  );
}
