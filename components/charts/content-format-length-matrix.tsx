"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";
import AxisHint from "./axis-hint";
import { MEDIAN_RATIO_STEPS, chartPalette, medianRatioBg, medianRatioStep } from "./chart-style";
import { ChartEmptyState, ChartTooltip } from "./chart-chrome";
import { CellTooltip, useCellTooltip } from "./cell-tooltip";

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

export default function ContentFormatLengthMatrix({
  data,
  baselineMedianViews,
  numberLocale,
  labels,
}: Props) {
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

  const mediaTypes = Array.from(new Set(data.map((point) => point.mediaType))).sort();
  const byKey = new Map(data.map((point) => [`${point.mediaType}:${point.lengthBucket}`, point]));
  const cellKeys = mediaTypes.flatMap((type) =>
    LENGTH_BUCKETS.map((bucket) => `${type}:${bucket}`).filter((key) => byKey.has(key)),
  );
  const { tip, cellProps, onGridKeyDown } = useCellTooltip<{ point: DataPoint; label: string }>(
    cellKeys,
  );

  if (!data.length) {
    return <ChartEmptyState label={copy.noData ?? "No data"} height={180} />;
  }

  const formatRatio = (value: number) =>
    baselineMedianViews > 0 ? `${(value / baselineMedianViews).toFixed(1)}×` : "—";

  return (
    <>
      <div className="w-full overflow-x-auto">
        <AxisHint
          x={copy.lengthBucket ?? "Character Count"}
          y={copy.contentType ?? "Content Type"}
        />
        <div
          onKeyDown={onGridKeyDown}
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
          {mediaTypes.map((type, row) => (
            <Fragment key={type}>
              <div className="text-muted-foreground flex items-center pr-2 text-xs font-medium">
                {getMediaTypeLabel(type)}
              </div>
              {LENGTH_BUCKETS.map((bucket, col) => {
                const point = byKey.get(`${type}:${bucket}`);
                const step = point ? medianRatioStep(point.medianViews, baselineMedianViews) : 0;
                const className = cn(
                  "flex h-16 min-w-0 flex-col justify-center rounded-lg border border-transparent px-2 text-center",
                  // Thin samples get a dashed outline — the quiet "take this
                  // one with a grain of salt" mark; details live in the tooltip.
                  point?.confidence === "low" && "border-foreground/20 border-dashed",
                );
                const style = {
                  backgroundColor: point
                    ? medianRatioBg[step]
                    : "color-mix(in oklch, var(--muted) 40%, transparent)",
                };
                if (!point) {
                  return (
                    <div key={`${type}-${bucket}`} className={className} style={style}>
                      <span className="text-foreground text-sm font-semibold tabular-nums">–</span>
                    </div>
                  );
                }
                const label = `${getMediaTypeLabel(type)} · ${bucket}`;
                return (
                  <button
                    key={`${type}-${bucket}`}
                    {...cellProps(
                      { point, label },
                      {
                        key: `${type}:${bucket}`,
                        row,
                        col,
                        label: `${label}: ${medianViewsLabel} ${point.medianViews.toLocaleString(locale)}`,
                      },
                    )}
                    className={cn(
                      className,
                      "focus-visible:ring-foreground transition-opacity duration-150 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-inset motion-reduce:transition-none",
                    )}
                    style={style}
                  >
                    {/* The darkest step needs pure white in dark mode to clear 4.5:1. */}
                    <span
                      className={cn(
                        "text-foreground text-sm font-semibold tabular-nums",
                        step === 2 && "dark:text-white",
                      )}
                    >
                      {point.medianViews.toLocaleString(locale)}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] tabular-nums",
                        step === 2 ? "text-foreground dark:text-white" : "text-foreground/80",
                      )}
                    >
                      {`${point.postCount} ${copy.posts}`}
                    </span>
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
        <div className="mt-2.5 flex items-center justify-end gap-1">
          <span className="text-muted-foreground text-[10px]">{copy.belowMedian ?? copy.less}</span>
          {MEDIAN_RATIO_STEPS.map((step) => (
            <div
              key={step}
              className="size-[10px] rounded-[3px]"
              style={{ backgroundColor: medianRatioBg[step] }}
            />
          ))}
          <span className="text-muted-foreground text-[10px]">{copy.aboveMedian ?? copy.more}</span>
        </div>
      </div>

      {tip && (
        <CellTooltip anchor={tip.anchor}>
          <ChartTooltip
            title={tip.data.label}
            rows={[
              {
                label: medianViewsLabel,
                value: tip.data.point.medianViews.toLocaleString(locale),
                color: chartPalette.blue,
              },
              {
                label: copy.vsMedian ?? "vs. your median",
                value: formatRatio(tip.data.point.medianViews),
              },
              { label: copy.avgViews, value: tip.data.point.avgViews.toLocaleString(locale) },
              { label: p75ViewsLabel, value: tip.data.point.p75Views.toLocaleString(locale) },
              { label: hitRateLabel, value: `${tip.data.point.hitRate}%` },
              { label: copy.posts, value: tip.data.point.postCount },
              {
                label: confidenceLabel,
                value:
                  copy.confidenceLevels?.[tip.data.point.confidence] ?? tip.data.point.confidence,
                muted: true,
              },
            ]}
          />
        </CellTooltip>
      )}
    </>
  );
}
