/** A cached value stamped with when it was read, so a reader can tell how old it is. */
export interface FreshReading<T> {
  value: T;
  fetchedAt: number;
}

/**
 * Whether a cached reading is recent enough to use: no older than `maxAgeMs`,
 * and fetched no earlier than `notBefore`. Anything else, including an entry
 * cached before readings carried a fetch time, counts as stale.
 */
export function isFreshReading<T>(
  reading: unknown,
  now: number,
  maxAgeMs: number,
  notBefore = Number.NEGATIVE_INFINITY,
): reading is FreshReading<T> {
  if (typeof reading !== "object" || reading === null) return false;
  const { fetchedAt } = reading as { fetchedAt?: unknown };
  if (typeof fetchedAt !== "number" || !("value" in reading)) return false;
  return now - fetchedAt <= maxAgeMs && fetchedAt >= notBefore;
}
