export const chartColors = {
  bar: "var(--muted-foreground)",
  views: "oklch(0.58 0.18 255)",
  avgViews: "oklch(0.66 0.14 215)",
  engagement: "oklch(0.58 0.15 152)",
  share: "oklch(0.70 0.16 72)",
  likes: "oklch(0.60 0.20 20)",
  reply: "oklch(0.58 0.18 250)",
  repost: "oklch(0.60 0.16 145)",
  quote: "oklch(0.58 0.19 305)",
  trend: "oklch(0.52 0.08 245)",
  volume: "oklch(0.56 0.04 250)",
  grid: "var(--border)",
  axis: "var(--muted-foreground)",
  tooltipBg: "var(--popover)",
  tooltipFg: "var(--popover-foreground)",
} as const;

export const chartMargin = { top: 8, right: 12, left: 0, bottom: 0 };

export const compactChartMargin = { top: 6, right: 10, left: 0, bottom: 0 };

export const axisTick = {
  fontSize: 11,
  fill: chartColors.axis,
};

export const compactAxisTick = {
  fontSize: 10,
  fill: chartColors.axis,
};

export const gridProps = {
  stroke: chartColors.grid,
  strokeDasharray: "3 3",
  vertical: false,
};

export const tooltipStyle = {
  backgroundColor: chartColors.tooltipBg,
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "0 8px 24px color-mix(in oklch, var(--foreground) 10%, transparent)",
  color: chartColors.tooltipFg,
  fontSize: 12,
};

export const tooltipLabelStyle = {
  color: chartColors.tooltipFg,
  fontWeight: 500,
};

export const tooltipItemStyle = {
  color: chartColors.tooltipFg,
};

export const legendStyle = {
  color: chartColors.axis,
  fontSize: 12,
};

export const barRadius: [number, number, number, number] = [3, 3, 0, 0];

export function formatCompactNumber(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}m`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return String(v);
}

export function formatShortDate(value: string, locale?: string) {
  return new Date(value).toLocaleDateString(locale, { month: "short", day: "numeric" });
}
