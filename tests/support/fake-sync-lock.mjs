// A stand-in for lib/database/postgres-sync-lock.ts, which
// tests/support/resolve.mjs swaps in. Like the advisory lock it replaces, it
// is held by one task at a time, and a caller that finds it held gets
// { acquired: false } instead of waiting.

let held = false;

export async function withPostgresSyncLock(task) {
  if (held) return { acquired: false };
  held = true;
  try {
    return { acquired: true, value: await task() };
  } finally {
    held = false;
  }
}

/** Holds the lock as another server process would; returns its release. */
export function holdSyncLock() {
  held = true;
  return () => {
    held = false;
  };
}
