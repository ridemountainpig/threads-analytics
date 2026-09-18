export type Granularity = "day" | "week" | "month";

function utcDate(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00Z`);
}

// ≤ ~3 months of data reads fine daily, up to ~a year weekly, beyond that
// monthly — thresholds carry a few days of slack so the 90d / 1y range
// presets land on the granularity users expect.
export function defaultGranularity(span: number): Granularity {
  if (span <= 92) return "day";
  if (span <= 370) return "week";
  return "month";
}

// Bucket key is the period's first calendar day (YYYY-MM-DD), so existing
// date formatters keep working on aggregated series.
export function bucketStart(dateKey: string, granularity: Granularity): string {
  if (granularity === "day") return dateKey;
  if (granularity === "month") return `${dateKey.slice(0, 7)}-01`;
  const date = utcDate(dateKey);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}
