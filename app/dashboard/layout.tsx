import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveAccount } from "@/lib/dashboard-data";
import Sidebar from "@/components/dashboard/sidebar";
import TimezoneSyncer from "@/components/timezone-syncer";
import { getDictionary } from "@/lib/i18n-server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await getSession();
  if (!authenticated) redirect("/login");

  const [{ locale, t }, account] = await Promise.all([getDictionary(), getActiveAccount()]);

  return (
    <div className="min-h-screen md:flex">
      <Sidebar
        username={account?.username}
        locale={locale}
        labels={t.nav}
        appName={t.common.appName}
      />
      <main className="min-w-0 flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      <TimezoneSyncer />
    </div>
  );
}
