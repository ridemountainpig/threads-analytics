import "server-only";

const globalForSyncLock = globalThis as unknown as {
  desktopSyncLocked?: boolean;
};

export async function withDesktopSyncLock<T>(
  task: () => Promise<T>,
): Promise<{ acquired: true; value: T } | { acquired: false }> {
  if (globalForSyncLock.desktopSyncLocked) return { acquired: false };

  globalForSyncLock.desktopSyncLocked = true;
  try {
    return { acquired: true, value: await task() };
  } finally {
    globalForSyncLock.desktopSyncLocked = false;
  }
}
