import { db } from "@/lib/db";
import { getSyncIntervalCached } from "@/lib/dashboard-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AccountManager from "./account-manager";
import SyncButton from "@/components/dashboard/sync-button";
import SyncIntervalSetting from "./sync-interval-setting";
import { dateLocales, getDictionary } from "@/lib/i18n-server";

export default async function SettingsPage() {
  const [{ locale, t }, accounts, syncInterval] = await Promise.all([
    getDictionary(),
    db.threadsAccount.findMany({
      include: { syncState: true },
      orderBy: { createdAt: "asc" },
    }),
    getSyncIntervalCached(),
  ]);

  const activeAccount = accounts.find((a) => a.isActive);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.settingsPage.title}</h1>
        <p className="text-muted-foreground text-sm">{t.settingsPage.subtitle}</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.settingsPage.accountsTitle}</CardTitle>
            <p className="text-muted-foreground text-sm">{t.settingsPage.accountsSub}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <AccountManager
              labels={t.settingsPage}
              syncLabels={{
                tokenExpired: t.sync.tokenExpired,
                failed: t.sync.failed,
                synced: t.sync.synced,
              }}
              dateLocale={dateLocales[locale]}
              accounts={accounts.map((a) => ({
                id: a.id,
                username: a.username,
                isActive: a.isActive,
                expiresAt: a.expiresAt.toISOString(),
                lastSyncedAt: a.syncState?.lastSyncedAt?.toISOString() ?? null,
              }))}
            />
          </CardContent>
        </Card>

        {activeAccount && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t.settingsPage.dataSync}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {t.settingsPage.dataSyncSub.replace("{username}", activeAccount.username)}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">{t.settingsPage.syncHelp}</p>
                <div className="flex justify-start">
                  <SyncButton
                    lastSyncedAt={activeAccount.syncState?.lastSyncedAt?.toISOString()}
                    syncInterval={syncInterval}
                    labels={t.sync}
                    dateLocale={dateLocales[locale]}
                  />
                </div>
              </div>

              <div className="border-t pt-5">
                <p className="mb-1 text-sm font-medium">{t.settingsPage.autoSync}</p>
                <p className="text-muted-foreground mb-3 text-sm">{t.settingsPage.autoSyncSub}</p>
                <SyncIntervalSetting
                  currentInterval={syncInterval}
                  labels={{
                    intervals: t.sync.intervals,
                    intervalUpdated: t.settingsPage.intervalUpdated,
                    invalidInterval: t.settingsPage.invalidInterval,
                    manualHelp: t.settingsPage.manualHelp,
                    autoHelp: t.settingsPage.autoHelp,
                    customInterval: t.settingsPage.customInterval,
                    minutes: t.settingsPage.minutes,
                    apply: t.timeRange.apply,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
