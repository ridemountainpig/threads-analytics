"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { setLocaleAction } from "@/actions/locale";
import { localeNames, locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageSwitcherProps {
  locale: Locale;
  compact?: boolean;
}

export default function LanguageSwitcher({ locale, compact }: LanguageSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLocale(nextLocale: Locale) {
    if (nextLocale === locale) return;
    startTransition(async () => {
      await setLocaleAction(nextLocale);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Language"
        disabled={pending}
        className={cn(
          "flex items-center transition-[background-color,color,transform] duration-150 outline-none focus:outline-none active:scale-[0.97] disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100",
          compact
            ? "bg-muted/70 hover:bg-muted data-[popup-open]:bg-muted h-7 min-w-20 gap-1.5 rounded-full px-3 text-xs font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50 data-[popup-open]:bg-accent data-[popup-open]:text-accent-foreground w-full gap-2.5 rounded-lg px-3 py-2 text-sm",
        )}
      >
        <Languages
          className={cn("shrink-0", compact ? "text-muted-foreground size-3.5" : "size-4")}
        />
        <span className="min-w-0 flex-1 truncate text-left">{localeNames[locale]}</span>
        <ChevronDown
          className={cn(
            "shrink-0 opacity-50 transition-transform duration-200 in-data-[popup-open]:rotate-180 motion-reduce:transition-none",
            compact ? "text-muted-foreground size-3.5" : "size-4",
          )}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} className="min-w-40">
        {locales.map((item) => (
          <DropdownMenuItem
            key={item}
            disabled={item === locale || pending}
            onClick={() => setLocale(item)}
            className="flex items-center gap-2"
          >
            <Check
              className={cn("size-3.5 shrink-0", item === locale ? "opacity-100" : "opacity-0")}
            />
            <span className="truncate">{localeNames[item]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
