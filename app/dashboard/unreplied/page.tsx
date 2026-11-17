import { decryptToken } from "@/lib/crypto";
import { getActiveAccount, getSyncIntervalCached } from "@/lib/dashboard-data";
import {
  getUnrepliedComments,
  parseUnrepliedRange,
  UNREPLIED_POST_LIMIT,
  UNREPLIED_RANGES,
} from "@/lib/unreplied-data";
import { replyRate } from "@/lib/today-replies";
import { StatCard } from "@/components/dashboard/stat-card";
import { NoAccountNotice } from "@/components/dashboard/no-account-notice";
import { TokenExpiredNotice } from "@/components/dashboard/token-expired-notice";
import { FirstSyncNotice } from "@/components/dashboard/first-sync-notice";
import PageHeader from "@/components/dashboard/page-header";
import { dateLocales, getDictionary } from "@/lib/i18n-server";
import { getServerTimezone } from "@/lib/server-timezone";
import RangeSwitch from "./range-switch";
import UnrepliedList, { type UnrepliedListProps } from "./unreplied-list";

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export default async function UnrepliedPage({ searchParams }: PageProps) {
  const { range } = await searchParams;
  const days = parseUnrepliedRange(range);
  const [{ locale, t }, account, syncInterval, tz] = await Promise.all([
    getDictionary(),
    getActiveAccount(),
    getSyncIntervalCached(),
    getServerTimezone(),
  ]);
  const dateLocale = dateLocales[locale];
  const u = t.unreplied;

  if (!account) {
    return (
      <NoAccountNotice
        message={t.common.noAccount}
        help={t.common.noAccountHelp}
        settingsLabel={t.common.settings}
      />
    );
  }

  if (account.expiresAt < new Date()) {
    return (
      <TokenExpiredNotice
        message={t.common.tokenExpired}
        help={t.common.tokenExpiredHelp}
        settingsLabel={t.common.settings}
      />
    );
  }

  const lastSyncedAt = account.syncState?.lastSyncedAt;
  if (!lastSyncedAt) {
    return (
      <FirstSyncNotice
        labels={{
          message: t.common.notSynced,
          help: t.common.notSyncedHelp,
          syncNow: t.common.syncNow,
          syncing: t.sync.syncing,
          inProgress: t.sync.inProgress,
          tokenExpired: t.sync.tokenExpired,
          failed: t.sync.failed,
          synced: t.sync.synced,
        }}
      />
    );
  }

  let accessToken: string;
  try {
    accessToken = decryptToken(account.accessToken);
  } catch {
    return (
      <TokenExpiredNotice
        message={t.common.credentialsUnavailable}
        help={t.common.tokenExpiredHelp}
        settingsLabel={t.common.settings}
      />
    );
  }

  const now = new Date();
  const result = await getUnrepliedComments(account.id, accessToken, days, now);
  const number = (value: number) => value.toLocaleString(dateLocale);

  const waitedFor = (timestamp: string) => {
    const ms = Math.max(0, now.getTime() - new Date(timestamp).getTime());
    const format = new Intl.RelativeTimeFormat(dateLocale, { numeric: "always", style: "short" });
    if (ms >= DAY_MS) return format.format(-Math.floor(ms / DAY_MS), "day");
    if (ms >= HOUR_MS) return format.format(-Math.floor(ms / HOUR_MS), "hour");
    return format.format(-Math.max(1, Math.floor(ms / 60_000)), "minute");
  };

  const listLabels = { ...u, viewOnThreads: t.postsPage.viewOnThreads };
  const listProps: UnrepliedListProps =
    result.status === "ok"
      ? {
          status: "ok",
          comments: result.comments.map((comment) => ({
            ...comment,
            waited: waitedFor(comment.timestamp),
          })),
          emptyMessage:
            result.postsWithReplies === 0 ? u.noPosts.replace("{days}", String(days)) : u.empty,
          notices: [
            result.skippedPosts > 0 &&
              u.postsSkipped.replace("{count}", number(UNREPLIED_POST_LIMIT)),
            result.truncatedPosts > 0 &&
              u.postsTruncated.replace("{count}", number(result.truncatedPosts)),
            result.failedPosts > 0 && u.postsFailed.replace("{count}", number(result.failedPosts)),
          ].filter((notice): notice is string => Boolean(notice)),
          labels: listLabels,
          locale: dateLocale,
          timeZone: tz,
        }
      : {
          status: "unavailable",
          reason: result.status,
          message:
            result.status === "missing_permission"
              ? u.missingPermission
              : result.status === "token_expired"
                ? u.tokenExpired
                : u.failed,
          labels: listLabels,
        };

  const awaiting = result.status === "ok" ? result.comments.length : null;
  const oldest =
    result.status === "ok"
      ? result.comments.reduce<string | null>(
          (min, c) => (min === null || c.timestamp < min ? c.timestamp : min),
          null,
        )
      : null;
  const rate =
    result.status === "ok"
      ? replyRate({ awaiting: awaiting ?? 0, answered: result.answered })
      : null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title={u.title}
        subtitle={u.subtitle}
        sync={{
          lastSyncedAt: lastSyncedAt.toISOString(),
          syncInterval,
          timeZone: tz,
          labels: t.sync,
          dateLocale,
        }}
        actions={
          <RangeSwitch
            value={days}
            options={UNREPLIED_RANGES.map((value) => ({
              value: String(value),
              label: u.rangeDays.replace("{days}", String(value)),
            }))}
            label={u.range}
          />
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard
          title={u.awaitingTitle}
          value={awaiting ?? "—"}
          sub={
            result.status === "ok"
              ? u.awaitingSub.replace("{count}", number(result.postsWithReplies))
              : undefined
          }
        />
        <StatCard
          title={u.oldestTitle}
          value={oldest ? waitedFor(oldest) : "—"}
          sub={result.status === "ok" && !oldest ? u.oldestNone : undefined}
        />
        <StatCard
          className="max-md:col-span-2"
          title={u.replyRateTitle}
          value={rate === null ? "—" : `${rate}%`}
          sub={
            result.status === "ok"
              ? u.replyRateSub
                  .replace("{answered}", number(result.answered))
                  .replace("{awaiting}", number(awaiting ?? 0))
              : undefined
          }
        />
      </div>

      <UnrepliedList {...listProps} />
    </div>
  );
}
