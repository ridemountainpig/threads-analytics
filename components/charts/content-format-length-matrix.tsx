"use client";

import { Fragment, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import AxisHint from "./axis-hint";
import { chartPalette } from "./chart-style";
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
    less: string;
    more: string;
    mediaTypes?: Record<string, string>;
    noData?: string;
  };
}

const LENGTH_BUCKETS = ["0-50", "51-150", "151-300", "301+"];

function getIntensity(value: number, max: number) {
  if (value <= 0 || max <= 0) return 0;
  return Math.max(1, Math.ceil((value / max) * 4));
}

// One hue stepped toward the muted track, matching the posting calendar —
// performance reads as saturation, not as a rainbow. The top step stays a
// mix (not the full hue) because these cells carry text.
const INTENSITY_BG: Record<number, string> = {
  0: "var(--muted)",
  1: `color-mix(in oklch, ${chartPalette.blue} 22%, var(--muted))`,
  2: `color-mix(in oklch, ${chartPalette.blue} 44%, var(--muted))`,
  3: `color-mix(in oklch, ${chartPalette.blue} 66%, var(--muted))`,
  4: `color-mix(in oklch, ${chartPalette.blue} 85%, var(--muted))`,
};

interface TooltipState {
  point: DataPoint;
  label: string;
  x: number;
  y: number;
}

export default function ContentFormatLengthMatrix({ data, numberLocale, labels }: Props) {
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
  const max = Math.max(...data.map((point) => point.medianViews));
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
          color={`${medianViewsLabel} / ${copy.colorIntensity ?? "Color Intensity"}`}
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
                const intensity = getIntensity(point?.medianViews ?? 0, max);
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
                    style={{ backgroundColor: INTENSITY_BG[intensity] }}
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
          <span className="text-muted-foreground/80 text-[9px]">{copy.less}</span>
          {[0, 1, 2, 3, 4].map((intensity) => (
            <div
              key={intensity}
              className="size-[10px] rounded-[3px]"
              style={{ backgroundColor: INTENSITY_BG[intensity] }}
            />
          ))}
          <span className="text-muted-foreground/80 text-[9px]">{copy.more}</span>
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
