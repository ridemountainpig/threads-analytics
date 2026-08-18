// Shared visual language for every analytics chart, modeled on Apple's
// charting style: one restrained system palette, hairline horizontal grids,
// quiet axes with tabular numerals, and color reserved for the data itself.

// Mid-lightness oklch values hold up on both the light and dark themes.
export const chartPalette = {
  blue: "oklch(0.62 0.17 252)",
  teal: "oklch(0.69 0.12 215)",
  green: "oklch(0.64 0.16 155)",
  orange: "oklch(0.72 0.15 65)",
  pink: "oklch(0.63 0.2 15)",
  indigo: "oklch(0.58 0.17 278)",
  purple: "oklch(0.63 0.2 305)",
  slate: "oklch(0.62 0.03 255)",
} as const;

export const chartColors = {
  // Contextual "volume" bars stay translucent gray so colored metrics lead.
  bar: "color-mix(in oklch, var(--muted-foreground) 55%, transparent)",
  views: chartPalette.blue,
  avgViews: chartPalette.teal,
  engagement: chartPalette.green,
  share: chartPalette.orange,
  likes: chartPalette.pink,
  reply: chartPalette.indigo,
  repost: chartPalette.green,
  quote: chartPalette.purple,
  trend: chartPalette.slate,
  // The audience tab's hero metric shares the first categorical slot so the
  // whole tab keeps one indigo identity; named here so it reads as a choice.
  followers: "var(--series-1)",
  volume: "color-mix(in oklch, var(--muted-foreground) 40%, transparent)",
  grid: "color-mix(in oklch, var(--muted-foreground) 16%, transparent)",
  axis: "var(--muted-foreground)",
} as const;

// Categorical slots for charts that plot several entities at once. Assign in
// order and never cycle — a sixth series folds into "other" or gets its own
// chart instead. Defined per theme in globals.css, where the two sets were
// validated against their own surfaces.
export const seriesColors = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
] as const;

/** Warm pole for signed values, against seriesColors[0] as the cool pole. */
export const negativeColor = "var(--series-negative)";

export const chartMargin = { top: 8, right: 12, left: 0, bottom: 0 };

export const compactChartMargin = { top: 6, right: 10, left: 0, bottom: 0 };

// Small text wants a touch of positive tracking; numerals set tabular so
// tick values align vertically along the axis.
export const axisTick = {
  fontSize: 11,
  fill: chartColors.axis,
  letterSpacing: "0.01em",
  fontVariantNumeric: "tabular-nums",
} as const;

export const compactAxisTick = {
  fontSize: 10,
  fill: chartColors.axis,
  letterSpacing: "0.015em",
  fontVariantNumeric: "tabular-nums",
} as const;

// Solid hairlines, horizontal only — dashes read as noise at this weight.
export const gridProps = {
  stroke: chartColors.grid,
  vertical: false,
} as const;

// Hover cursor presets: a faint wash behind bars, a hairline for lines.
export const barCursor = { fill: "color-mix(in oklch, var(--foreground) 5%, transparent)" };

export const lineCursor = {
  stroke: "color-mix(in oklch, var(--muted-foreground) 35%, transparent)",
  strokeWidth: 1,
};

// Active dots get a background-colored ring so they lift off the line.
export function activeDot(color: string) {
  return { r: 4, fill: color, stroke: "var(--background)", strokeWidth: 2 };
}

export const barRadius: [number, number, number, number] = [4, 4, 0, 0];

export function formatCompactNumber(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}m`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return String(v);
}

export function formatShortDate(
  value: string,
  locale: string,
  timeZone: string,
  options?: { year?: boolean },
) {
  // Aggregated YYYY-MM-DD values are already calendar dates in the analytics
  // time zone, so format those as UTC date keys rather than shifting them again.
  const isCalendarDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(isCalendarDate ? `${value}T00:00:00Z` : value);

  return new Intl.DateTimeFormat(locale, {
    year: options?.year ? "numeric" : undefined,
    month: "short",
    day: "numeric",
    timeZone: isCalendarDate ? "UTC" : timeZone,
  }).format(date);
}

// Whether a set of date values crosses more than one calendar year. When it
// does, charts should show the year so month/day labels aren't ambiguous
// (e.g. the "全部" / all-time range spanning multiple years).
export function spansMultipleYears(values: Array<string | null | undefined>) {
  const years = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    const year =
      /^(\d{4})-\d{2}-\d{2}/.exec(value)?.[1] ?? String(new Date(value).getUTCFullYear());
    years.add(year);
    if (years.size > 1) return true;
  }
  return false;
}
