"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart2, FileText, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";
import LanguageSwitcher from "@/components/dashboard/language-switcher";
import AccountSwitcher from "@/components/dashboard/account-switcher";
import type { Locale } from "@/lib/i18n";

const navItems = [
  { href: "/dashboard/overview", labelKey: "overview", icon: LayoutDashboard },
  { href: "/dashboard/analytics", labelKey: "analytics", icon: BarChart2 },
  { href: "/dashboard/posts", labelKey: "posts", icon: FileText },
  { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
] as const;

interface Account {
  id: string;
  username: string;
  isActive: boolean;
}

interface SidebarProps {
  accounts: Account[];
  locale: Locale;
  appName: string;
  labels: {
    overview: string;
    analytics: string;
    posts: string;
    settings: string;
    signOut: string;
    switchAccount: string;
  };
}

export default function Sidebar({ accounts, locale, appName, labels }: SidebarProps) {
  const pathname = usePathname();
  const activeUsername = accounts.find((a) => a.isActive)?.username;
  const multiAccount = accounts.length > 1;

  return (
    <>
      <header className="bg-background/95 sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 backdrop-blur md:hidden">
        <div className="min-w-0 flex-1 pr-2">
          <h2 className="truncate text-sm font-semibold">{appName}</h2>
          {multiAccount ? (
            <AccountSwitcher accounts={accounts} label={labels.switchAccount} />
          ) : (
            activeUsername && (
              <p className="text-muted-foreground truncate text-xs">@{activeUsername}</p>
            )
          )}
        </div>
        <LanguageSwitcher locale={locale} compact />
      </header>

      <aside className="bg-background sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r md:flex">
        <div className="border-b p-4">
          <h2 className="text-sm font-semibold">{appName}</h2>
          {multiAccount ? (
            <div className="mt-0.5">
              <AccountSwitcher accounts={accounts} label={labels.switchAccount} />
            </div>
          ) : (
            activeUsername && (
              <p className="text-muted-foreground mt-0.5 truncate text-xs">@{activeUsername}</p>
            )
          )}
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {navItems.map(({ href, labelKey, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {labels[labelKey]}
            </Link>
          ))}
        </nav>

        <div className="space-y-2 border-t p-2">
          <LanguageSwitcher locale={locale} />
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground hover:bg-accent/50 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors"
            >
              <LogOut className="size-4 shrink-0" />
              {labels.signOut}
            </button>
          </form>
        </div>
      </aside>

      <nav className="bg-background/95 fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t px-2 py-1.5 backdrop-blur md:hidden">
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[11px] transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="max-w-full truncate">{labels[labelKey]}</span>
            </Link>
          );
        })}
        <form action={logoutAction} className="flex min-w-0 flex-col items-center">
          <button
            type="submit"
            className="text-muted-foreground hover:text-foreground flex w-full min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[11px] transition-colors"
          >
            <LogOut className="size-4 shrink-0" />
            <span className="max-w-full truncate">{labels.signOut}</span>
          </button>
        </form>
      </nav>
    </>
  );
}
