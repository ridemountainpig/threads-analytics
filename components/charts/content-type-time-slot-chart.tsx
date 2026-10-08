"use client";

import { Fragment, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import AxisHint from "./axis-hint";
import {
  MEDIAN_RATIO_STEPS,
  chartPalette,
  formatCompactNumber,
  medianRatioBg,
  medianRatioStep,
} from "./chart-style";
import { ChartEmptyState, ChartTooltip } from "./chart-chrome";

interface DataPoint {
  mediaType: string;
  hour: number;
  postCount: number;
  medianViews: number;
  avgViews: number;
  confidence: "low" | "medium" | "high";
}

interface Props {
  data: DataPoint[];
  /** The account's median views; cells are colored by their ratio to it. */
  baselineMedianViews: number;
  dateLocale?: string;
  labels?: {
    posts: string;
    avgViews: string;
    medianViews?: string;
    confidence?: string;
    confidenceLevels?: Record<"low" | "medium" | "high", string>;
    contentType?: string;
    hour?: string;
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

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number, locale?: string) {
  try {
    return new Intl.DateTimeFormat(locale ?? "en-US", { hour: "numeric", hourCycle: "h23" }).format(
      new Date(2000, 0, 1, h),
    );
  } catch {
    if (h === 0) return "0h";
    return `${h}h`;
  }
}

interface TooltipState {
  point: DataPoint;
  label: string;
  x: number;
  y: number;
}

export default function ContentTypeTimeSlotChart({
  data,
  baselineMedianViews,
  dateLocale,
  labels,
}: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const copy = labels ?? {
    posts: "Posts",
    avgViews: "Avg Views",
    medianViews: "Median Views",
    confidence: "Confidence",
    less: "Less",
    more: "More",
    noData: "No data",
  };
  const medianViewsLabel = copy.medianViews ?? "Median Views";
  const confidenceLabel = copy.confidence ?? "Confidence";
  const getMediaTypeLabel = (mediaType: string) => copy.mediaTypes?.[mediaType] ?? mediaType;

  if (!data.length) {
    return <ChartEmptyState label={copy.noData} height={180} />;
  }

  const mediaTypes = Array.from(new Set(data.map((d) => d.mediaType))).sort();
  const formatRatio = (value: number) =>
    baselineMedianViews > 0 ? `${(value / baselineMedianViews).toFixed(1)}×` : "—";
  const byKey = new Map(data.map((d) => [`${d.mediaType}:${d.hour}`, d]));

  return (
    <>
      <div className="w-full overflow-x-auto">
        <AxisHint
          columns={copy.hour ?? "Hour"}
          rows={copy.contentType ?? "Content Type"}
          color={copy.vsMedian ?? "vs. your median"}
        />
        <div
          className="grid min-w-[720px] gap-[3px]"
          style={{
            gridTemplateColumns: `90px repeat(${HOURS.length}, minmax(22px, 1fr))`,
          }}
        >
          <div />
          {HOURS.map((h) => (
            <div
              key={h}
              className="text-muted-foreground pb-0.5 text-center text-[9px] leading-tight tracking-[0.02em] tabular-nums"
            >
              {h % 3 === 0 ? formatHour(h, dateLocale) : ""}
            </div>
          ))}
          {mediaTypes.map((type) => (
            <Fragment key={type}>
              <div className="text-muted-foreground flex items-center pr-2 text-xs font-medium">
                {getMediaTypeLabel(type)}
              </div>
              {HOURS.map((hour) => {
                const point = byKey.get(`${type}:${hour}`);
                const step = point ? medianRatioStep(point.medianViews, baselineMedianViews) : 0;
                return (
                  <div
                    key={`${type}-${hour}`}
                    onMouseMove={
                      point
                        ? (e) =>
                            setTooltip({
                              point,
                              label: `${getMediaTypeLabel(type)} · ${formatHour(hour, dateLocale)}`,
                              x: e.clientX,
                              y: e.clientY,
                            })
                        : undefined
                    }
                    onMouseLeave={() => setTooltip(null)}
                    className={cn(
                      "flex h-6 min-w-0 items-center justify-center rounded-[4px] transition-opacity duration-150 motion-reduce:transition-none",
                      point && "hover:opacity-80",
                      // Low-confidence cells stay visible but visually tentative.
                      point?.confidence === "low" && "opacity-60",
                    )}
                    style={{
                      backgroundColor: point
                        ? medianRatioBg[step]
                        : "color-mix(in oklch, var(--muted) 40%, transparent)",
                    }}
                  >
                    {point ? (
                      <span
                        className={cn(
                          "text-[9px] leading-none font-medium tabular-nums",
                          // Keep the value legible as the cell darkens.
                          step === 2 ? "text-white" : "text-foreground/70",
                        )}
                      >
                        {formatCompactNumber(point.medianViews)}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
        <div className="mt-2.5 flex items-center justify-end gap-1">
          <span className="text-muted-foreground/80 text-[10px]">
            {copy.belowMedian ?? copy.less}
          </span>
          {MEDIAN_RATIO_STEPS.map((step) => (
            <div
              key={step}
              className="size-3 rounded-[3px]"
              style={{ backgroundColor: medianRatioBg[step] }}
            />
          ))}
          <span className="text-muted-foreground/80 text-[10px]">
            {copy.aboveMedian ?? copy.more}
          </span>
        </div>
      </div>

      {tooltip &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50"
            style={{ top: tooltip.y + 14, left: tooltip.x + 14 }}
          >
            <ChartTooltip
              title={tooltip.label}
              subtitle={`${confidenceLabel}: ${
                copy.confidenceLevels?.[tooltip.point.confidence] ?? tooltip.point.confidence
              }`}
              rows={[
                {
                  label: medianViewsLabel,
                  value: tooltip.point.medianViews.toLocaleString(),
                  color: chartPalette.blue,
                },
                {
                  label: copy.vsMedian ?? "vs. your median",
                  value: formatRatio(tooltip.point.medianViews),
                },
                { label: copy.avgViews, value: tooltip.point.avgViews.toLocaleString() },
                {
                  label: copy.posts,
                  value: tooltip.point.postCount.toLocaleString(),
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
