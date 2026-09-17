import { db } from "@/lib/db";
import { getActiveAccount } from "@/lib/dashboard-data";
import { NoAccountNotice } from "@/components/dashboard/no-account-notice";
import { TokenExpiredNotice } from "@/components/dashboard/token-expired-notice";
import { FirstSyncNotice } from "@/components/dashboard/first-sync-notice";
import { dateLocales, getDictionary } from "@/lib/i18n-server";
import { getServerTimezone } from "@/lib/server-timezone";
import GiveawayTool from "./giveaway-tool";

const POST_PICKER_LIMIT = 100;

export default async function GiveawayPage() {
  const [{ locale, t }, account, tz] = await Promise.all([
    getDictionary(),
    getActiveAccount(),
    getServerTimezone(),
  ]);

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

  if (!account.syncState?.lastSyncedAt) {
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

  const posts = await db.post.findMany({
    where: { accountId: account.id, mediaType: { not: "REPOST_FACADE" } },
    orderBy: { timestamp: "desc" },
    take: POST_PICKER_LIMIT,
    select: { id: true, text: true, timestamp: true, replies: true, permalink: true },
  });

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.giveaway.title}</h1>
        <p className="text-muted-foreground text-sm">{t.giveaway.subtitle}</p>
      </div>
      <GiveawayTool
        posts={posts.map((p) => ({ ...p, timestamp: p.timestamp.toISOString() }))}
        labels={t.giveaway}
        dateLocale={dateLocales[locale]}
        timeZone={tz}
      />
    </div>
  );
}
