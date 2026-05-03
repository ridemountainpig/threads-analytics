import "server-only";

import { Pool } from "pg";

const SYNC_LOCK_ID = 258621162;

const globalForSyncLock = globalThis as unknown as {
  syncLockPool?: Pool;
};

function getSyncLockPool() {
  if (!globalForSyncLock.syncLockPool) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
    pool.on("error", (err) => {
      console.error("[sync-lock] idle client error:", err.message);
    });
    globalForSyncLock.syncLockPool = pool;
  }

  return globalForSyncLock.syncLockPool;
}

export async function withSyncLock<T>(
  task: () => Promise<T>,
): Promise<{ acquired: true; value: T } | { acquired: false }> {
  const client = await getSyncLockPool().connect();

  try {
    const lock = await client.query<{ locked: boolean }>("select pg_try_advisory_lock($1) locked", [
      SYNC_LOCK_ID,
    ]);

    if (!lock.rows[0]?.locked) return { acquired: false };

    try {
      return { acquired: true, value: await task() };
    } finally {
      await client.query("select pg_advisory_unlock($1)", [SYNC_LOCK_ID]);
    }
  } finally {
    client.release();
  }
}
