import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Sidebar from "@/components/dashboard/sidebar";
import SyncStatusRefresher from "@/components/dashboard/sync-status-refresher";
import UpdateBanner from "@/components/dashboard/update-banner";
import TimezoneSyncer from "@/components/timezone-syncer";
import { getDictionary } from "@/lib/i18n-server";
import { getCurrentVersionLink, isUpdateCheckConfigured } from "@/lib/update-check";
import { isDesktopApp } from "@/lib/runtime-target";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await getSession();
  if (!authenticated) redirect("/login");

  const [{ locale, t }, accounts] = await Promise.all([
    getDictionary(),
    db.threadsAccount.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        username: true,
        isActive: true,
        syncState: { select: { lastSyncedAt: true } },
      },
    }),
  ]);
  const activeAccount = accounts.find((account) => account.isActive);

  return (
    <div className="min-h-screen md:flex">
      <Sidebar
        accounts={accounts.map(({ id, username, isActive }) => ({ id, username, isActive }))}
        locale={locale}
        labels={t.nav}
        appName={t.common.appName}
        version={getCurrentVersionLink()}
        showSignOut={!isDesktopApp}
      />
      <main className="min-w-0 flex-1 overflow-auto pb-20 md:pb-0">
        {isUpdateCheckConfigured() && <UpdateBanner locale={locale} labels={t.updateBanner} />}
        {children}
      </main>
      <TimezoneSyncer />
      {isDesktopApp && (
        <SyncStatusRefresher
          initialLastSyncedAt={activeAccount?.syncState?.lastSyncedAt?.toISOString() ?? null}
        />
      )}
    </div>
  );
}
