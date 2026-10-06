import { isDesktopApp } from "./runtime-target";

export type RangeOption = "7" | "30" | "90" | "180" | "365" | "all";

/**
 * The Mac's timezone on desktop, null on web. The desktop server and its
 * WebView run on the same machine, so dates there follow the system clock
 * instead of the ANALYTICS_TIME_ZONE baked into the build. Read once at server
 * start, so a timezone change applies after the app is reopened.
 */
export const DESKTOP_TIME_ZONE = isDesktopApp ? systemTimeZone() : null;

const DEFAULT_TIME_ZONE = DESKTOP_TIME_ZONE ?? process.env.ANALYTICS_TIME_ZONE ?? "Asia/Taipei";

const DAY_MS = 24 * 60 * 60 * 1000;

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

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

function systemTimeZone(): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidTimeZone(timeZone) ? timeZone : "UTC";
}

function normalizeTimeZone(timeZone: string) {
  return isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE;
}

export function parseDateOnlyInTimeZone(value: string, timeZone: string, endOfDay: boolean) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = endOfDay ? 23 : 0;
  const minute = endOfDay ? 59 : 0;
  const second = endOfDay ? 59 : 0;
  const millisecond = endOfDay ? 999 : 0;
  const wallTime = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);

  // The wall time occurs at wallTime - offset, for whichever offset holds at
  // that instant. The offsets a day either side cover any DST change near it:
  // after a fall-back the wall time occurs twice, and where clocks spring
  // forward at midnight (Santiago, Havana) a day's 00:00 never occurs at all.
  const offsets = new Set(
    [-DAY_MS, 0, DAY_MS].map((shift) => getTimeZoneOffsetMs(timeZone, new Date(wallTime + shift))),
  );
  const candidates = [...offsets].map((offset) => wallTime - offset).sort((a, b) => a - b);
  const occurrences = candidates.filter(
    (instant) => wallTime - getTimeZoneOffsetMs(timeZone, new Date(instant)) === instant,
  );

  // A day runs from the first occurrence of its midnight to the last of its
  // 23:59:59.999. A skipped wall time instead resolves to where the clock
  // jumps, so the day neither starts in the one before nor ends in the next.
  if (occurrences.length > 0) {
    return new Date(endOfDay ? occurrences[occurrences.length - 1] : occurrences[0]);
  }
  return new Date(endOfDay ? candidates[0] : candidates[candidates.length - 1]);
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
