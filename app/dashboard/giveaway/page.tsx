import { db } from "@/lib/db";
import { getActiveAccount } from "@/lib/dashboard-data";
import { NoAccountNotice } from "@/components/dashboard/no-account-notice";
import { TokenExpiredNotice } from "@/components/dashboard/token-expired-notice";
import { FirstSyncNotice } from "@/components/dashboard/first-sync-notice";
import { dateLocales, getDictionary } from "@/lib/i18n-server";
import { getServerTimezone } from "@/lib/server-timezone";
import GiveawayTool from "./giveaway-tool";

const POST_PICKER_LIMIT = 100;

interface PageProps {
  searchParams: Promise<{ post?: string }>;
}

export default async function GiveawayPage({ searchParams }: PageProps) {
  const { post: postParam } = await searchParams;
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

  const postSelect = { id: true, text: true, timestamp: true, replies: true, permalink: true };
  const posts = await db.post.findMany({
    where: { accountId: account.id, mediaType: { not: "REPOST_FACADE" } },
    orderBy: { timestamp: "desc" },
    take: POST_PICKER_LIMIT,
    select: postSelect,
  });
  // A post linked from its detail page may be older than the picker reaches.
  if (postParam && !posts.some((p) => p.id === postParam)) {
    const linked = await db.post.findFirst({
      where: { id: postParam, accountId: account.id, mediaType: { not: "REPOST_FACADE" } },
      select: postSelect,
    });
    if (linked) posts.push(linked);
  }

  const initialPostId = posts.some((p) => p.id === postParam) ? postParam : undefined;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.giveaway.title}</h1>
        <p className="text-muted-foreground text-sm">{t.giveaway.subtitle}</p>
      </div>
      <GiveawayTool
        // Any new ?post= request starts a fresh draw, even one that can't be preselected.
        key={postParam ?? ""}
        posts={posts.map((p) => ({ ...p, timestamp: p.timestamp.toISOString() }))}
        labels={t.giveaway}
        dateLocale={dateLocales[locale]}
        timeZone={tz}
        initialPostId={initialPostId}
      />
    </div>
  );
}
