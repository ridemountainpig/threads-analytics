"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  FileText,
  Settings,
  LogOut,
  ArrowUpRight,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";
import LanguageSwitcher from "@/components/dashboard/language-switcher";
import AccountSwitcher from "@/components/dashboard/account-switcher";
import type { Locale } from "@/lib/i18n";
import type { ImageVersionLink } from "@/lib/image-update";

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
  version: ImageVersionLink | null;
  labels: {
    overview: string;
    analytics: string;
    posts: string;
    settings: string;
    signOut: string;
    switchAccount: string;
  };
}

export default function Sidebar({ accounts, locale, appName, version, labels }: SidebarProps) {
  const pathname = usePathname();
  const activeUsername = accounts.find((a) => a.isActive)?.username;
  const multiAccount = accounts.length > 1;

  return (
    <>
      {/* Mobile header: a translucent material layer content scrolls beneath */}
      <header className="bg-background/80 border-border/60 reduce-transparency:bg-background reduce-transparency:backdrop-blur-none more-contrast:border-border sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 backdrop-blur-xl md:hidden">
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

      {/* Desktop sidebar: the darker sidebar material separates structure from content */}
      <aside className="bg-sidebar border-border/60 sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r md:flex">
        <div className="border-border/60 border-b p-4">
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
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-[background-color,color,transform] duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
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

        <div className="border-border/60 space-y-2 border-t p-2">
          <LanguageSwitcher locale={locale} />
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground hover:bg-accent/50 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-[background-color,color,transform] duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              <LogOut className="size-4 shrink-0" />
              {labels.signOut}
            </button>
          </form>
          {version && (
            <a
              href={version.url}
              target="_blank"
              rel="noreferrer"
              className="group text-muted-foreground/70 hover:text-foreground hover:bg-accent/50 flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition-[background-color,color] duration-150 motion-reduce:transition-none"
            >
              <span className="flex size-4 shrink-0 items-center justify-center">
                <Tag className="size-3.5" />
              </span>
              <span className="truncate font-mono text-[11px] tracking-[0.02em]">
                {version.tag}
              </span>
              <ArrowUpRight className="size-3 shrink-0 -translate-x-0.5 opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:translate-x-0 motion-reduce:transition-[opacity]" />
            </a>
          )}
        </div>
      </aside>

      {/* Mobile tab bar: iOS grammar — the active tab is tinted, not boxed;
          translucent material with safe-area padding for the home indicator */}
      <nav className="bg-background/80 border-border/60 reduce-transparency:bg-background reduce-transparency:backdrop-blur-none more-contrast:border-border fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] leading-3 tracking-[0.01em] transition-[color,transform] duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
                active ? "text-tint font-semibold" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("size-5 shrink-0", active && "stroke-[2.25]")} />
              <span className="max-w-full truncate">{labels[labelKey]}</span>
            </Link>
          );
        })}
        <form action={logoutAction} className="flex min-w-0 flex-col items-center">
          <button
            type="submit"
            className="text-muted-foreground flex w-full min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] leading-3 tracking-[0.01em] transition-[color,transform] duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <LogOut className="size-5 shrink-0" />
            <span className="max-w-full truncate">{labels.signOut}</span>
          </button>
        </form>
      </nav>
    </>
  );
}
