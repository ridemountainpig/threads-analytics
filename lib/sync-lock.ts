import "server-only";

import { withTargetSyncLock } from "@/lib/database/sync-lock-target";

export function withSyncLock<T>(task: () => Promise<T>) {
  return withTargetSyncLock(task);
}
