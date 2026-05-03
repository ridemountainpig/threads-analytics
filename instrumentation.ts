export async function register() {
  if (process.env.NEXT_RUNTIME !== "edge") {
    const { startSyncScheduler } = await import("./lib/sync-scheduler");
    startSyncScheduler();
  }
}
