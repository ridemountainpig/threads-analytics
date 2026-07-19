import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { getSyncIntervalCached } from "@/lib/dashboard-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
            <CardDescription>{t.settingsPage.accountsSub}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/dashboard/settings/token-guide"
              className="bg-muted/50 hover:bg-muted flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
            >
              <BookOpen className="text-muted-foreground size-4 shrink-0" />
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-medium">{t.settingsPage.tokenGuideCardLink}</span>{" "}
                <span className="text-muted-foreground">{t.settingsPage.tokenHelp}</span>
              </span>
              <ChevronRight className="text-muted-foreground size-4 shrink-0" />
            </Link>
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
