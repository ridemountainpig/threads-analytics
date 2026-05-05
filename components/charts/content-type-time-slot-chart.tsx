"use client";

import { Fragment, useState } from "react";
import { cn } from "@/lib/utils";
import AxisHint from "./axis-hint";

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
    less: string;
    more: string;
    mediaTypes?: Record<string, string>;
    noData?: string;
  };
}

function getIntensity(value: number, max: number) {
  if (value <= 0 || max <= 0) return 0;
  return Math.max(1, Math.ceil((value / max) * 4));
}

const INTENSITY_CLASSES: Record<number, string> = {
  0: "bg-muted",
  1: "bg-primary/10",
  2: "bg-primary/25",
  3: "bg-primary/40",
  4: "bg-primary/55",
};

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

export default function ContentTypeTimeSlotChart({ data, dateLocale, labels }: Props) {
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
    return (
      <div className="text-muted-foreground flex h-[180px] items-center justify-center text-sm">
        {copy.noData}
      </div>
    );
  }

  const mediaTypes = Array.from(new Set(data.map((d) => d.mediaType))).sort();
  const max = Math.max(...data.map((d) => d.medianViews));
  const byKey = new Map(data.map((d) => [`${d.mediaType}:${d.hour}`, d]));

  return (
    <>
      <div className="w-full overflow-x-auto">
        <AxisHint
          columns={copy.hour ?? "Hour"}
          rows={copy.contentType ?? "Content Type"}
          color={`${medianViewsLabel} / ${copy.colorIntensity ?? "Color Intensity"}`}
        />
        <div
          className="grid min-w-[720px] gap-0.5"
          style={{
            gridTemplateColumns: `90px repeat(${HOURS.length}, minmax(22px, 1fr))`,
          }}
        >
          <div />
          {HOURS.map((h) => (
            <div key={h} className="text-muted-foreground text-center text-[9px] leading-tight">
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
                const intensity = getIntensity(point?.medianViews ?? 0, max);
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
                      "flex h-7 min-w-0 flex-col items-center justify-center rounded-sm text-[9px]",
                      INTENSITY_CLASSES[intensity],
                      point?.confidence === "low" &&
                        "border-muted-foreground/40 border border-dashed",
                      point?.confidence === "medium" && "border-muted-foreground/20 border",
                      !point && "bg-muted/30",
                    )}
                  >
                    {point ? (
                      <span className="font-medium tabular-nums">
                        {point.medianViews > 999
                          ? `${(point.medianViews / 1000).toFixed(1)}k`
                          : point.medianViews}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-end gap-1">
          <span className="text-muted-foreground text-[10px]">{copy.less}</span>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={cn("size-3 rounded-[2px]", INTENSITY_CLASSES[i])} />
          ))}
          <span className="text-muted-foreground text-[10px]">{copy.more}</span>
        </div>
      </div>

      {tooltip && (
        <div
          className="bg-popover border-border pointer-events-none fixed z-50 rounded border px-3 py-2 text-xs shadow-md"
          style={{ top: tooltip.y + 14, left: tooltip.x + 14 }}
        >
          <p className="text-foreground mb-1.5 font-medium">{tooltip.label}</p>
          <div className="text-muted-foreground space-y-0.5">
            <p>
              {medianViewsLabel}: {tooltip.point.medianViews.toLocaleString()}
            </p>
            <p>
              {copy.avgViews}: {tooltip.point.avgViews.toLocaleString()}
            </p>
            <p>
              {copy.posts}: {tooltip.point.postCount}
            </p>
            <p>
              {confidenceLabel}:{" "}
              {copy.confidenceLevels?.[tooltip.point.confidence] ?? tooltip.point.confidence}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
