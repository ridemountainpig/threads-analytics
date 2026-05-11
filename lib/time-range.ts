export type RangeOption = "7" | "30" | "90" | "180" | "365" | "all";

const DEFAULT_TIME_ZONE = process.env.ANALYTICS_TIME_ZONE ?? "Asia/Taipei";

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
  timeZone = DEFAULT_TIME_ZONE,
): { since: Date; until: Date } {
  if (params && typeof params === "object") {
    const { from, to, range } = params;
    if (from && to) {
      const tz = normalizeTimeZone(timeZone);
      const since = parseDateOnlyInTimeZone(from, tz, false);
      const until = parseDateOnlyInTimeZone(to, tz, true);
      if (!isNaN(since.getTime()) && !isNaN(until.getTime())) {
        return { since, until };
      }
    }
    return getTimeRange(range, timeZone);
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

function normalizeTimeZone(timeZone: string) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return timeZone;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

function parseDateOnlyInTimeZone(value: string, timeZone: string, endOfDay: boolean) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = endOfDay ? 23 : 0;
  const minute = endOfDay ? 59 : 0;
  const second = endOfDay ? 59 : 0;
  const millisecond = endOfDay ? 999 : 0;
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
  const offset = getTimeZoneOffsetMs(timeZone, utcGuess);
  let result = new Date(utcGuess.getTime() - offset);

  const adjustedOffset = getTimeZoneOffsetMs(timeZone, result);
  if (adjustedOffset !== offset) {
    result = new Date(utcGuess.getTime() - adjustedOffset);
  }

  return result;
}

function getTimeZoneOffsetMs(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return asUtc - date.getTime() + date.getUTCMilliseconds();
}
