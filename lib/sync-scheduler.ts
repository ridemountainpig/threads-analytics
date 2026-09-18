import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma";
import { syncAccount } from "@/lib/sync-service";
import { withSyncLock } from "@/lib/sync-lock";

const DEFAULT_POLL_MS = 60_000;
const INITIAL_DELAY_MS = 10_000;

const globalForScheduler = globalThis as unknown as {
  threadsAnalyticsSyncSchedulerStarted?: boolean;
  threadsAnalyticsSyncInFlight?: boolean;
};

export type ScheduledAccountResult = { username: string } & (
  | { status: "token_expired" }
  | { status: "not_due"; lastSyncedAt: string; nextSyncAt: string }
  | {
      status: "synced";
      postsCount: number;
      insightsFailed?: number;
      startedAt: string;
      finishedAt: string;
    }
  | { status: "failed"; error: string }
);

type AccountStatus = ScheduledAccountResult["status"];

export type ScheduledSyncResult =
  | { status: "disabled"; interval: string }
  | { status: "locked" }
  | { status: "in_progress" }
  | { status: "no_accounts" }
  | { status: AccountStatus; interval: string; accounts: ScheduledAccountResult[] };

// The run's own status is the most urgent one among its accounts, so a single
// failure still surfaces (and turns the cron response into a 500) even when
// every other account synced fine.
const STATUS_PRIORITY: AccountStatus[] = ["failed", "synced", "token_expired", "not_due"];

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
  if (process.env.SYNC_SCHEDULER_ENABLED !== "true") {
    console.info("[sync-scheduler] disabled; set SYNC_SCHEDULER_ENABLED=true to enable");
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

  // Idle outcomes (nothing due, disabled, or a token that stays expired) would
  // otherwise repeat every poll; log them once per change and only ever log
  // real work or failures every time.
  let lastIdleLog: string | undefined;
  const run = () => {
    void runScheduledSync()
      .then((result) => {
        if (result.status === "not_due" || result.status === "in_progress") return;
        if (result.status === "synced" || result.status === "failed") {
          lastIdleLog = undefined;
          console.info("[sync-scheduler]", result);
          return;
        }
        const key = JSON.stringify(result);
        if (key === lastIdleLog) return;
        lastIdleLog = key;
        console.info("[sync-scheduler]", result);
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

  // Every connected account is kept in sync, not just the active one, so
  // follower snapshots (which can't be backfilled) and token renewals never
  // lapse for the accounts the user isn't currently viewing.
  const accounts = await db.threadsAccount.findMany({
    include: { syncState: true },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });

  if (accounts.length === 0) return { status: "no_accounts" };

  const results: ScheduledAccountResult[] = [];
  for (const account of accounts) {
    results.push(await syncAccountIfDue(account, { force, intervalMinutes }));
  }

  const status =
    STATUS_PRIORITY.find((candidate) => results.some((r) => r.status === candidate)) ?? "not_due";
  return { status, interval, accounts: results };
}

async function syncAccountIfDue(
  account: Prisma.ThreadsAccountGetPayload<{ include: { syncState: true } }>,
  { force, intervalMinutes }: { force: boolean; intervalMinutes: number },
): Promise<ScheduledAccountResult> {
  const { username } = account;
  if (account.expiresAt < new Date()) return { username, status: "token_expired" };

  const lastSyncedAt = account.syncState?.lastSyncedAt;
  if (!force && lastSyncedAt) {
    const nextSyncAt = new Date(lastSyncedAt.getTime() + intervalMinutes * 60_000);

    if (Date.now() < nextSyncAt.getTime()) {
      return {
        username,
        status: "not_due",
        lastSyncedAt: lastSyncedAt.toISOString(),
        nextSyncAt: nextSyncAt.toISOString(),
      };
    }
  }

  const startedAt = new Date();
  const result = await syncAccount(account);

  if (result.error) return { username, status: "failed", error: result.error };

  return {
    username,
    status: "synced",
    postsCount: result.postsCount ?? 0,
    ...(result.insightsFailed ? { insightsFailed: result.insightsFailed } : {}),
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
  };
}
