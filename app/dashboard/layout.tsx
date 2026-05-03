import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Sidebar from "@/components/dashboard/sidebar";
import TimezoneSyncer from "@/components/timezone-syncer";
import { getDictionary } from "@/lib/i18n-server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await getSession();
  if (!authenticated) redirect("/login");

  const [{ locale, t }, accounts] = await Promise.all([
    getDictionary(),
    db.threadsAccount.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, username: true, isActive: true },
    }),
  ]);

  return (
    <div className="min-h-screen md:flex">
      <Sidebar accounts={accounts} locale={locale} labels={t.nav} appName={t.common.appName} />
      <main className="min-w-0 flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      <TimezoneSyncer />
    </div>
  );
}
