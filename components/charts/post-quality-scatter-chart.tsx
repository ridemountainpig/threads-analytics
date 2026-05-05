"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import AxisHint from "./axis-hint";
import {
  axisTick,
  chartColors,
  compactChartMargin,
  formatCompactNumber,
  gridProps,
  legendStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "./chart-style";

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
  };
}

const QUADRANT_COLORS: Record<DataPoint["quadrant"], string> = {
  breakout: chartColors.engagement,
  conversation: chartColors.quote,
  broadcast: chartColors.views,
  underperforming: chartColors.share,
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

function truncateText(text: string, noText?: string) {
  return text.length > 96 ? `${text.slice(0, 96)}...` : text || (noText ?? "(no text)");
}

export default function PostQualityScatterChart({ data, labels }: Props) {
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
    return (
      <div className="text-muted-foreground flex h-[280px] items-center justify-center text-sm">
        {copy.noData}
      </div>
    );
  }

  const getMediaTypeLabel = (mediaType: string) => labels?.mediaTypes?.[mediaType] ?? mediaType;

  return (
    <>
      <AxisHint
        x={copy.views}
        y={copy.engagementRate}
        size={copy.dotSizeShares ?? copy.shares}
        color={copy.quadrantGroup ?? "Quadrant"}
      />
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={compactChartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            type="number"
            dataKey="views"
            name={copy.views}
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
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as DataPoint;
              return (
                <div
                  style={tooltipStyle}
                  className="border-border bg-popover text-popover-foreground max-w-[280px] rounded border px-2 py-1 text-xs shadow-sm"
                >
                  <p style={tooltipLabelStyle}>{truncateText(point.text, copy.noText)}</p>
                  <p>
                    {copy.views}: {point.views.toLocaleString()}
                  </p>
                  <p>
                    {copy.engagementRate}: {point.engagementRate.toFixed(2)}%
                  </p>
                  <p>
                    {copy.replyRate}: {point.replyRate.toFixed(2)}%
                  </p>
                  <p>
                    {copy.shareRate}: {point.shareRate.toFixed(2)}%
                  </p>
                  <p>
                    {copy.shares}: {point.shares.toLocaleString()}
                  </p>
                  <p>
                    {copy.viewsMultiplier ?? "Views vs Median"}: {point.viewsMultiplier}x
                  </p>
                  <p>
                    {copy.textLength ?? "Text Length"}: {point.textLength}
                  </p>
                  <p className="text-muted-foreground">
                    {getMediaTypeLabel(point.mediaType)} ·{" "}
                    {getQuadrantLabel(point.quadrant, labels)}
                  </p>
                </div>
              );
            }}
          />
          <Legend iconSize={9} wrapperStyle={legendStyle} />
          {(["breakout", "conversation", "broadcast", "underperforming"] as const).map(
            (quadrant) => (
              <Scatter
                key={quadrant}
                name={getQuadrantLabel(quadrant, labels)}
                data={data.filter((point) => point.quadrant === quadrant)}
                fill={QUADRANT_COLORS[quadrant]}
                fillOpacity={quadrant === "underperforming" ? 0.45 : 0.82}
              />
            ),
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </>
  );
}
