import "server-only";

import { unstable_cache } from "next/cache";
import { isFreshReading, type FreshReading } from "@/lib/fresh-reading";

/**
 * unstable_cache that never hands back an expired entry. unstable_cache serves
 * one as is and only refreshes it in the background, and a scheduled sync can't
 * expire it (revalidateTag needs a request), so the first visit after a quiet
 * stretch would show data read hours or days earlier. Past `ttlSeconds`, or
 * when the entry was read before `notBefore` (ms), `fn` is called directly; the
 * background refresh still renews the entry for the next visit. Errors from
 * `fn` propagate, as with unstable_cache.
 */
export async function cachedFresh<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  options: { ttlSeconds: number; tags: string[]; notBefore?: number },
): Promise<T> {
  const cached = await unstable_cache(
    async (): Promise<FreshReading<T>> => ({ value: await fn(), fetchedAt: Date.now() }),
    keyParts,
    { revalidate: options.ttlSeconds, tags: options.tags },
  )();
  if (isFreshReading<T>(cached, Date.now(), options.ttlSeconds * 1000, options.notBefore)) {
    return cached.value;
  }
  return fn();
}
