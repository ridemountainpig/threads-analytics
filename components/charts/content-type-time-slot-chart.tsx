"use client";

import { Fragment } from "react";
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
import { CellTooltip, useCellTooltip } from "./cell-tooltip";

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

export default function ContentTypeTimeSlotChart({
  data,
  baselineMedianViews,
  dateLocale,
  labels,
}: Props) {
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

  const mediaTypes = Array.from(new Set(data.map((d) => d.mediaType))).sort();
  const byKey = new Map(data.map((d) => [`${d.mediaType}:${d.hour}`, d]));
  const cellKeys = mediaTypes.flatMap((type) =>
    HOURS.map((hour) => `${type}:${hour}`).filter((key) => byKey.has(key)),
  );
  const { tip, cellProps, onGridKeyDown } = useCellTooltip<{ point: DataPoint; label: string }>(
    cellKeys,
  );

  if (!data.length) {
    return <ChartEmptyState label={copy.noData} height={180} />;
  }

  const formatRatio = (value: number) =>
    baselineMedianViews > 0 ? `${(value / baselineMedianViews).toFixed(1)}×` : "—";

  return (
    <>
      <div className="w-full overflow-x-auto">
        <AxisHint x={copy.hour ?? "Hour"} y={copy.contentType ?? "Content Type"} />
        <div
          onKeyDown={onGridKeyDown}
          className="grid min-w-[720px] gap-[3px]"
          style={{
            gridTemplateColumns: `90px repeat(${HOURS.length}, minmax(22px, 1fr))`,
          }}
        >
          <div />
          {HOURS.map((h) => (
            <div
              key={h}
              className="text-muted-foreground pb-0.5 text-center text-[10px] leading-tight tracking-[0.01em] whitespace-nowrap tabular-nums"
            >
              {h % 3 === 0 ? formatHour(h, dateLocale) : ""}
            </div>
          ))}
          {mediaTypes.map((type, row) => (
            <Fragment key={type}>
              <div className="text-muted-foreground flex items-center pr-2 text-xs font-medium">
                {getMediaTypeLabel(type)}
              </div>
              {HOURS.map((hour) => {
                const point = byKey.get(`${type}:${hour}`);
                if (!point) {
                  return (
                    <div
                      key={`${type}-${hour}`}
                      className="h-6 min-w-0 rounded-[4px]"
                      style={{
                        backgroundColor: "color-mix(in oklch, var(--muted) 40%, transparent)",
                      }}
                    />
                  );
                }
                const step = medianRatioStep(point.medianViews, baselineMedianViews);
                const label = `${getMediaTypeLabel(type)} · ${formatHour(hour, dateLocale)}`;
                return (
                  <button
                    key={`${type}-${hour}`}
                    {...cellProps(
                      { point, label },
                      {
                        key: `${type}:${hour}`,
                        row,
                        col: hour,
                        label: `${label}: ${medianViewsLabel} ${point.medianViews.toLocaleString(dateLocale)}`,
                      },
                    )}
                    className="focus-visible:ring-foreground flex h-6 min-w-0 items-center justify-center rounded-[4px] transition-opacity duration-150 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-inset motion-reduce:transition-none"
                    style={{
                      // Low confidence fades the fill, not the number, so it stays legible.
                      backgroundColor:
                        point.confidence === "low"
                          ? `color-mix(in oklch, ${medianRatioBg[step]} 60%, transparent)`
                          : medianRatioBg[step],
                    }}
                  >
                    <span
                      className={cn(
                        "text-[10px] leading-none font-medium tracking-[-0.02em] tabular-nums",
                        // On the darkest fill only pure white clears 4.5:1 in dark mode.
                        step === 2 ? "text-foreground dark:text-white" : "text-foreground/80",
                      )}
                    >
                      {formatCompactNumber(point.medianViews)}
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
              className="size-3 rounded-[3px]"
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
            subtitle={`${confidenceLabel}: ${
              copy.confidenceLevels?.[tip.data.point.confidence] ?? tip.data.point.confidence
            }`}
            rows={[
              {
                label: medianViewsLabel,
                value: tip.data.point.medianViews.toLocaleString(dateLocale),
                color: chartPalette.blue,
              },
              {
                label: copy.vsMedian ?? "vs. your median",
                value: formatRatio(tip.data.point.medianViews),
              },
              { label: copy.avgViews, value: tip.data.point.avgViews.toLocaleString(dateLocale) },
              {
                label: copy.posts,
                value: tip.data.point.postCount.toLocaleString(dateLocale),
                muted: true,
              },
            ]}
          />
        </CellTooltip>
      )}
    </>
  );
}
