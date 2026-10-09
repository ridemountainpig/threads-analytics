// Kept dependency-free so the test suite can exercise it directly with Node's
// type stripping, outside of Next.

export type Limiter = <T>(task: () => Promise<T>) => Promise<T>;

/** Runs at most `max` tasks at once; the rest start in call order as slots free up. */
export function createLimiter(max: number): Limiter {
  let active = 0;
  const waiting: Array<() => void> = [];

  return async (task) => {
    if (active < max) active++;
    else await new Promise<void>((resolve) => waiting.push(resolve));
    try {
      return await task();
    } finally {
      // Hand the slot straight to the next waiter, so a new caller can't slip
      // in between and push the count past max.
      const next = waiting.shift();
      if (next) next();
      else active--;
    }
  };
}
