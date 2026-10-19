import { normalizeIntlSpaces } from "@/lib/utils";

/** Labels an hour of the day (0–23) in the locale's own clock: "9 PM", "21時", "下午9時". */
export function hourLabeler(locale: string): (hour: number) => string {
  // Formatted in UTC on a fixed date, so no zone or DST shift can move the hour.
  const format = new Intl.DateTimeFormat(locale, { hour: "numeric", timeZone: "UTC" });
  return (hour) => normalizeIntlSpaces(format.format(new Date(Date.UTC(2000, 0, 1, hour))));
}
