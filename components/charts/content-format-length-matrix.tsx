"use client";

import { Fragment, useState } from "react";
import { cn } from "@/lib/utils";
import AxisHint from "./axis-hint";

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
  labels?: {
    posts: string;
    avgViews: string;
    medianViews?: string;
    p75Views?: string;
    hitRate?: string;
    confidence?: string;
    contentType?: string;
    lengthBucket?: string;
    colorIntensity?: string;
    less: string;
    more: string;
    mediaTypes?: Record<string, string>;
  };
}

const LENGTH_BUCKETS = ["0-50", "51-150", "151-300", "301+"];

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

interface TooltipState {
  point: DataPoint;
  label: string;
  x: number;
  y: number;
}

export default function ContentFormatLengthMatrix({ data, labels }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const copy = labels ?? {
    posts: "Posts",
    avgViews: "Avg Views",
    medianViews: "Median Views",
    p75Views: "P75 Views",
    hitRate: "Hit Rate",
    confidence: "Confidence",
    less: "Less",
    more: "More",
  };
  const medianViewsLabel = copy.medianViews ?? "Median Views";
  const p75ViewsLabel = copy.p75Views ?? "P75 Views";
  const hitRateLabel = copy.hitRate ?? "Hit Rate";
  const confidenceLabel = copy.confidence ?? "Confidence";
  const getMediaTypeLabel = (mediaType: string) => copy.mediaTypes?.[mediaType] ?? mediaType;

  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-[180px] items-center justify-center text-sm">
        No data
      </div>
    );
  }

  const mediaTypes = Array.from(new Set(data.map((point) => point.mediaType))).sort();
  const max = Math.max(...data.map((point) => point.medianViews));
  const byKey = new Map(data.map((point) => [`${point.mediaType}:${point.lengthBucket}`, point]));

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
            <div key={bucket} className="text-muted-foreground px-2 text-center text-[11px]">
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
                    onMouseMove={
                      point
                        ? (e) =>
                            setTooltip({
                              point,
                              label: `${getMediaTypeLabel(type)} · ${bucket}`,
                              x: e.clientX,
                              y: e.clientY,
                            })
                        : undefined
                    }
                    onMouseLeave={() => setTooltip(null)}
                    className={cn(
                      "border-border flex h-16 min-w-0 flex-col justify-center rounded border px-2 text-center",
                      "text-foreground",
                      INTENSITY_CLASSES[intensity],
                      point && "cursor-pointer",
                      point?.confidence === "low" && "border-muted-foreground/40 border-dashed",
                      point?.confidence === "medium" && "border-muted-foreground/30",
                    )}
                  >
                    <span className="text-sm font-semibold tabular-nums">
                      {point ? point.medianViews.toLocaleString() : "-"}
                    </span>
                    <span className="text-foreground/70 text-[10px]">
                      {point ? `${point.postCount} ${copy.posts}` : ""}
                    </span>
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-end gap-1">
          <span className="text-muted-foreground text-[10px]">{copy.less}</span>
          {[0, 1, 2, 3, 4].map((intensity) => (
            <div
              key={intensity}
              className={cn("size-3 rounded-[2px]", INTENSITY_CLASSES[intensity])}
            />
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
              {p75ViewsLabel}: {tooltip.point.p75Views.toLocaleString()}
            </p>
            <p>
              {hitRateLabel}: {tooltip.point.hitRate}%
            </p>
            <p>
              {copy.posts}: {tooltip.point.postCount}
            </p>
            <p>
              {confidenceLabel}: {tooltip.point.confidence}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
