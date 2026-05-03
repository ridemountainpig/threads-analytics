import "server-only";

import { db } from "@/lib/db";
import { syncActiveAccount } from "@/lib/sync-service";
import { withSyncLock } from "@/lib/sync-lock";

const DEFAULT_POLL_MS = 60_000;
const INITIAL_DELAY_MS = 10_000;

const globalForScheduler = globalThis as unknown as {
  threadsAnalyticsSyncSchedulerStarted?: boolean;
  threadsAnalyticsSyncInFlight?: boolean;
};

export type ScheduledSyncResult =
  | { status: "disabled"; interval: string }
  | { status: "locked" }
  | { status: "in_progress" }
  | { status: "no_active_account" }
  | { status: "token_expired"; username: string }
  | {
      status: "not_due";
      interval: string;
      username: string;
      lastSyncedAt: string;
      nextSyncAt: string;
    }
  | {
      status: "synced";
      username: string;
      postsCount: number;
      insightsFailed?: number;
      startedAt: string;
      finishedAt: string;
    }
  | { status: "failed"; error: string };

function getPollMs() {
  const configured = Number(process.env.SYNC_SCHEDULER_POLL_MS);
  if (!Number.isFinite(configured) || configured < 10_000) return DEFAULT_POLL_MS;
  return configured;
}

function getIntervalMinutes(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 0;

  const minutes = Number.parseInt(value, 10);
  return Number.isFinite(minutes) ? minutes : 0;
}

export function startSyncScheduler() {
  if (process.env.SYNC_SCHEDULER_ENABLED === "false") {
    console.info("[sync-scheduler] disabled by SYNC_SCHEDULER_ENABLED=false");
    return;
  }

  if (globalForScheduler.threadsAnalyticsSyncSchedulerStarted) return;

  globalForScheduler.threadsAnalyticsSyncSchedulerStarted = true;
  const pollMs = getPollMs();

  console.info("[sync-scheduler] started", {
    initialDelayMs: INITIAL_DELAY_MS,
    pollMs,
    runtime: process.env.NEXT_RUNTIME ?? "nodejs",
  });

  const run = () => {
    void runScheduledSync()
      .then((result) => {
        if (result.status !== "not_due" && result.status !== "in_progress") {
          console.info("[sync-scheduler]", result);
        }
      })
      .catch((error) => {
        console.error("[sync-scheduler] unexpected failure", error);
      });
  };

  const initial = setTimeout(run, INITIAL_DELAY_MS);
  initial.unref?.();

  const interval = setInterval(run, pollMs);
  interval.unref?.();
}

export async function runScheduledSync(
  options: { force?: boolean } = {},
): Promise<ScheduledSyncResult> {
  if (globalForScheduler.threadsAnalyticsSyncInFlight) return { status: "in_progress" };

  globalForScheduler.threadsAnalyticsSyncInFlight = true;

  try {
    const locked = await withSyncLock(async () => runScheduledSyncWithLock(options));
    if (!locked.acquired) return { status: "locked" };

    return locked.value;
  } finally {
    globalForScheduler.threadsAnalyticsSyncInFlight = false;
  }
}

async function runScheduledSyncWithLock({
  force = false,
}: {
  force?: boolean;
}): Promise<ScheduledSyncResult> {
  const setting = await db.appSettings.findUnique({ where: { key: "syncInterval" } });
  const interval = setting?.value ?? "0";
  const intervalMinutes = getIntervalMinutes(interval);

  if (!force && intervalMinutes <= 0) return { status: "disabled", interval };

  const account = await db.threadsAccount.findFirst({
    where: { isActive: true },
    include: { syncState: true },
  });

  if (!account) return { status: "no_active_account" };
  if (account.expiresAt < new Date())
    return { status: "token_expired", username: account.username };

  const lastSyncedAt = account.syncState?.lastSyncedAt;

  if (!force && lastSyncedAt) {
    const nextSyncAt = new Date(lastSyncedAt.getTime() + intervalMinutes * 60_000);

    if (Date.now() < nextSyncAt.getTime()) {
      return {
        status: "not_due",
        interval,
        username: account.username,
        lastSyncedAt: lastSyncedAt.toISOString(),
        nextSyncAt: nextSyncAt.toISOString(),
      };
    }
  }

  const startedAt = new Date();
  const result = await syncActiveAccount();

  if (result.error) return { status: "failed", error: result.error };

  return {
    status: "synced",
    username: account.username,
    postsCount: result.postsCount ?? 0,
    ...(result.insightsFailed ? { insightsFailed: result.insightsFailed } : {}),
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
  };
}
