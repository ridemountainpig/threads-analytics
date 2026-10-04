// When a scheduled sync of an account comes due. Kept dependency-free so the
// test suite can exercise it directly with Node's type stripping, outside of
// Next.
//
// lastSyncedAt is stamped when the previous sync finished, while a cron job
// fires on a fixed schedule — and on Vercel Hobby anywhere within the
// scheduled hour. A cron call on the same interval as the setting therefore
// arrives a little short of it, and a strict check would skip every other
// call. Cron calls count an account as due once 90% of the interval has
// passed. On a cron schedule up to ten times finer than the interval (hourly
// calls with a six-hour setting, say), the call before the matching one still
// falls short of that, so the setting keeps its meaning.
//
// The built-in scheduler (Docker, VPS, desktop app) polls every minute, so it
// is never more than a minute late and keeps the strict check.

/** Share of the interval a cron call may arrive early and still sync. */
export const CRON_EARLY_FRACTION = 0.1;

export function syncDueAt(
  lastSyncedAt: Date,
  intervalMinutes: number,
  { cron = false }: { cron?: boolean } = {},
): Date {
  const intervalMs = intervalMinutes * 60_000;
  return new Date(lastSyncedAt.getTime() + intervalMs * (cron ? 1 - CRON_EARLY_FRACTION : 1));
}
