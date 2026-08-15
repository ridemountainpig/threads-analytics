import { seriesColors } from "./chart-style";
import type { DemographicSlice } from "@/lib/followers";

interface FollowerDemographicsChartProps {
  data: DemographicSlice[];
  /** Display names resolved on the server — see lib/demographic-labels. */
  keyLabels: Record<string, string>;
  /** Pre-formatted endpoint dates, shown per card so the comparison is
   *  self-describing without scrolling back to the section header. */
  compareDates?: { from: string; to: string };
  dateLocale?: string;
  labels?: {
    noData: string;
    /** Localized name for "percentage point" — pp / 百分點 / ポイント. */
    pointSuffix: string;
    baselineMarker: string;
    compare: string;
  };
}

/**
 * A change that rounds to zero from below is still negative, and Number
 * formatting keeps the sign: "-0pp" reads as a bug rather than as "unchanged".
 */
function formatSigned(value: number, locale: string) {
  const normalized = Object.is(value, -0) || value === 0 ? 0 : value;
  return `${normalized > 0 ? "+" : ""}${normalized.toLocaleString(locale)}`;
}

/** Below this fraction of the widest bar, the marker lands on the bar's own
 *  edge and reads as a rendering artifact rather than as a baseline. */
const MARKER_MIN_TRAVEL = 0.015;

function changeClass(value: number) {
  if (value > 0) return "text-green-600 dark:text-green-500";
  if (value < 0) return "text-red-500";
  return "text-muted-foreground";
}

export default function FollowerDemographicsChart({
  data,
  keyLabels,
  compareDates,
  dateLocale,
  labels,
}: FollowerDemographicsChartProps) {
  const locale = dateLocale ?? "en-US";
  const copy = labels ?? {
    noData: "No data",
    pointSuffix: "pp",
    baselineMarker: "Baseline position",
    compare: "Change between",
  };

  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
        {copy.noData}
      </div>
    );
  }

  const max = Math.max(...data.map((slice) => slice.value), 1);
  // With a baseline to compare against, the numbers move below the bar: the
  // count and the percentage-point delta together don't fit beside it at half
  // card width.
  const hasComparison = data.some((slice) => slice.shareChange !== undefined);

  // Where this row sat on the baseline date, so the direction of travel is
  // readable without parsing the numbers — but only when the two positions are
  // far enough apart to actually look like two positions.
  const showsMarker = (slice: DemographicSlice) =>
    slice.previousValue !== undefined &&
    slice.previousValue > 0 &&
    Math.abs(slice.previousValue - slice.value) / max >= MARKER_MIN_TRAVEL;
  const anyMarker = data.some(showsMarker);

  // The marker sits outside the clipped track so it can overhang the bar top and
  // bottom, and carries a surface-coloured ring so it stays legible whether it
  // lands on the filled portion or on the empty track.
  const bar = (slice: DemographicSlice) => (
    <div className="relative h-3.5 min-w-0 flex-1">
      <div className="bg-muted h-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(2, Math.round((slice.value / max) * 100))}%`,
            backgroundColor: seriesColors[0],
          }}
        />
      </div>
      {showsMarker(slice) && (
        <span
          className="bg-foreground absolute -top-1 -bottom-1 w-0.5 rounded-full"
          style={{
            left: `${Math.min(100, Math.max(0, Math.round((slice.previousValue! / max) * 100)))}%`,
            boxShadow: "0 0 0 1.5px var(--card)",
          }}
        />
      )}
    </div>
  );

  return (
    <div className="py-1">
      {hasComparison && (
        <div className="text-muted-foreground mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          {anyMarker && (
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-foreground inline-block h-3 w-0.5 rounded-full" />
              {copy.baselineMarker}
            </span>
          )}
          {compareDates && (
            <span>
              {copy.compare} {compareDates.from} → {compareDates.to}
            </span>
          )}
        </div>
      )}
      <div className={hasComparison ? "space-y-3.5" : "space-y-2.5"}>
        {data.map((slice) => {
          const label = keyLabels[slice.key] ?? slice.key;
          return (
            <div
              key={slice.key}
              className="grid grid-cols-[minmax(4rem,7rem)_1fr] items-center gap-3"
            >
              <p className="truncate text-sm" title={label}>
                {label}
              </p>
              {hasComparison ? (
                <div className="min-w-0">
                  <div className="flex items-center">{bar(slice)}</div>
                  <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                    {slice.value.toLocaleString(locale)} · {slice.share.toFixed(1)}%
                    {slice.valueChange !== undefined && slice.shareChange !== undefined && (
                      <>
                        {" · "}
                        <span className={changeClass(slice.valueChange)}>
                          {formatSigned(slice.valueChange, locale)}
                        </span>
                        {" · "}
                        <span className={changeClass(slice.shareChange)}>
                          {formatSigned(slice.shareChange, locale)} {copy.pointSuffix}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-2">
                  {bar(slice)}
                  <span className="text-muted-foreground w-24 shrink-0 text-right text-xs tabular-nums">
                    {slice.value.toLocaleString(locale)} · {slice.share.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
