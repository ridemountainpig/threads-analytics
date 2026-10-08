"use client";

import { Fragment, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import AxisHint from "./axis-hint";
import { MEDIAN_RATIO_STEPS, chartPalette, medianRatioBg, medianRatioStep } from "./chart-style";
import { ChartEmptyState, ChartTooltip } from "./chart-chrome";

interface DataPoint {
  mediaType: string;
  lengthBucket: string;
  postCount: number;
  avgViews: number;
  medianViews: number;
  p75Views: number;
  hitRate: number;
  confidence: "low" | "medium" | "high";
}

interface Props {
  data: DataPoint[];
  /** The account's median views; cells are colored by their ratio to it. */
  baselineMedianViews: number;
  numberLocale?: string;
  labels?: {
    posts: string;
    avgViews: string;
    medianViews?: string;
    p75Views?: string;
    hitRate?: string;
    confidence?: string;
    confidenceLevels?: Record<"low" | "medium" | "high", string>;
    contentType?: string;
    lengthBucket?: string;
    colorIntensity?: string;
    vsMedian?: string;
    belowMedian?: string;
    aboveMedian?: string;
    less: string;
    more: string;
    mediaTypes?: Record<string, string>;
    noData?: string;
  };
}

const LENGTH_BUCKETS = ["0-50", "51-150", "151-300", "301+"];

interface TooltipState {
  point: DataPoint;
  label: string;
  x: number;
  y: number;
}

export default function ContentFormatLengthMatrix({
  data,
  baselineMedianViews,
  numberLocale,
  labels,
}: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const locale = numberLocale ?? "en-US";

  const copy = labels ?? {
    posts: "Posts",
    avgViews: "Avg Views",
    medianViews: "Median Views",
    p75Views: "P75 Views",
    hitRate: "Hit Rate",
    confidence: "Confidence",
    less: "Less",
    more: "More",
    noData: "No data",
  };
  const medianViewsLabel = copy.medianViews ?? "Median Views";
  const p75ViewsLabel = copy.p75Views ?? "P75 Views";
  const hitRateLabel = copy.hitRate ?? "Hit Rate";
  const confidenceLabel = copy.confidence ?? "Confidence";
  const getMediaTypeLabel = (mediaType: string) => copy.mediaTypes?.[mediaType] ?? mediaType;

  if (!data.length) {
    return <ChartEmptyState label={copy.noData ?? "No data"} height={180} />;
  }

  const mediaTypes = Array.from(new Set(data.map((point) => point.mediaType))).sort();
  const formatRatio = (value: number) =>
    baselineMedianViews > 0 ? `${(value / baselineMedianViews).toFixed(1)}×` : "—";
  const byKey = new Map(data.map((point) => [`${point.mediaType}:${point.lengthBucket}`, point]));

  const showTooltip = (point: DataPoint, label: string) => (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ point, label, x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <>
      <div className="w-full overflow-x-auto">
        <AxisHint
          columns={copy.lengthBucket ?? "Character Count"}
          rows={copy.contentType ?? "Content Type"}
          color={copy.vsMedian ?? "vs. your median"}
        />
        <div
          className="grid min-w-[520px] gap-1"
          style={{
            gridTemplateColumns: `112px repeat(${LENGTH_BUCKETS.length}, minmax(88px, 1fr))`,
          }}
        >
          <div />
          {LENGTH_BUCKETS.map((bucket) => (
            <div
              key={bucket}
              className="text-muted-foreground px-2 text-center text-[11px] tracking-[0.01em] tabular-nums"
            >
              {bucket}
            </div>
          ))}
          {mediaTypes.map((type) => (
            <Fragment key={type}>
              <div className="text-muted-foreground flex items-center pr-2 text-xs font-medium">
                {getMediaTypeLabel(type)}
              </div>
              {LENGTH_BUCKETS.map((bucket) => {
                const point = byKey.get(`${type}:${bucket}`);
                const step = point ? medianRatioStep(point.medianViews, baselineMedianViews) : 0;
                return (
                  <div
                    key={`${type}-${bucket}`}
                    onMouseEnter={
                      point
                        ? showTooltip(point, `${getMediaTypeLabel(type)} · ${bucket}`)
                        : undefined
                    }
                    onMouseMove={
                      point
                        ? showTooltip(point, `${getMediaTypeLabel(type)} · ${bucket}`)
                        : undefined
                    }
                    onMouseLeave={() => setTooltip(null)}
                    className={cn(
                      "flex h-16 min-w-0 flex-col justify-center rounded-lg border border-transparent px-2 text-center transition-opacity duration-150 motion-reduce:transition-none",
                      point && "hover:opacity-80",
                      // Thin samples get a dashed outline — the quiet "take this
                      // one with a grain of salt" mark; details live in the tooltip.
                      point?.confidence === "low" && "border-foreground/20 border-dashed",
                    )}
                    style={{
                      backgroundColor: point
                        ? medianRatioBg[step]
                        : "color-mix(in oklch, var(--muted) 40%, transparent)",
                    }}
                  >
                    <span className="text-foreground text-sm font-semibold tabular-nums">
                      {point ? point.medianViews.toLocaleString(locale) : "–"}
                    </span>
                    <span className="text-foreground/70 text-[10px] tabular-nums">
                      {point ? `${point.postCount} ${copy.posts}` : ""}
                    </span>
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
        <div className="mt-2.5 flex items-center justify-end gap-1">
          <span className="text-muted-foreground/80 text-[9px]">
            {copy.belowMedian ?? copy.less}
          </span>
          {MEDIAN_RATIO_STEPS.map((step) => (
            <div
              key={step}
              className="size-[10px] rounded-[3px]"
              style={{ backgroundColor: medianRatioBg[step] }}
            />
          ))}
          <span className="text-muted-foreground/80 text-[9px]">
            {copy.aboveMedian ?? copy.more}
          </span>
        </div>
      </div>

      {tooltip &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[calc(100%+8px)]"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <ChartTooltip
              title={tooltip.label}
              rows={[
                {
                  label: medianViewsLabel,
                  value: tooltip.point.medianViews.toLocaleString(locale),
                  color: chartPalette.blue,
                },
                {
                  label: copy.vsMedian ?? "vs. your median",
                  value: formatRatio(tooltip.point.medianViews),
                },
                { label: copy.avgViews, value: tooltip.point.avgViews.toLocaleString(locale) },
                { label: p75ViewsLabel, value: tooltip.point.p75Views.toLocaleString(locale) },
                { label: hitRateLabel, value: `${tooltip.point.hitRate}%` },
                { label: copy.posts, value: tooltip.point.postCount },
                {
                  label: confidenceLabel,
                  value:
                    copy.confidenceLevels?.[tooltip.point.confidence] ?? tooltip.point.confidence,
                  muted: true,
                },
              ]}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
