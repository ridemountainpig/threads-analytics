export type RangeOption = "7" | "30" | "90" | "180" | "365" | "all";

const RANGE_DAYS: Record<string, number | null> = {
  "7": 7,
  "30": 30,
  "90": 90,
  "180": 180,
  "365": 365,
  all: null,
};

export function getTimeRange(
  params:
    | { range?: string | null; from?: string | null; to?: string | null }
    | RangeOption
    | string
    | undefined
    | null,
): { since: Date; until: Date } {
  if (params && typeof params === "object") {
    const { from, to, range } = params;
    if (from && to) {
      const since = new Date(from);
      const until = new Date(to);
      until.setHours(23, 59, 59, 999);
      if (!isNaN(since.getTime()) && !isNaN(until.getTime())) {
        return { since, until };
      }
    }
    return getTimeRange(range);
  }

  const range = params;
  const until = new Date();
  const key = range ?? "90";
  const days = Object.hasOwn(RANGE_DAYS, key) ? RANGE_DAYS[key] : 90;
  const since =
    days != null ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : new Date("2020-01-01");
  return { since, until };
}

export function toUnix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}
