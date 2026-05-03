/** One complete Gregorian year (Jan 1–Dec 31) for the heatmap. */
export function expandPostingCalendarSeries(
  data: Array<{ date: string; count: number }>,
  selectedYear: string,
): Array<{ date: string; count: number }> {
  const byDate = new Map(data.map((d) => [d.date, d.count]));
  if (data.length === 0 || !selectedYear) return [];

  const y = Number(selectedYear);
  if (!Number.isFinite(y)) return [];

  const out: Array<{ date: string; count: number }> = [];
  const startMs = Date.UTC(y, 0, 1);
  const endMs = Date.UTC(y, 11, 31);
  for (let t = startMs; t <= endMs; t += 86400000) {
    const dt = new Date(t);
    const dateStr = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
    out.push({ date: dateStr, count: byDate.get(dateStr) ?? 0 });
  }
  return out;
}
