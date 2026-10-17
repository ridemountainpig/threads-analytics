"use client";

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
  side?: "top" | "bottom";
  iconOnly?: boolean;
  className?: string;
}

export default function LanguageSwitcher({
  locale,
  side = "bottom",
  iconOnly,
  className,
}: LanguageSwitcherProps) {
  const [pending, startTransition] = useTransition();

  function setLocale(nextLocale: Locale) {
    if (nextLocale === locale) return;
    startTransition(async () => {
      // The action revalidates the layout, so its response already carries
      // the re-rendered page — no router.refresh() needed.
      await setLocaleAction(nextLocale);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Language"
        title={iconOnly ? localeNames[locale] : undefined}
        disabled={pending}
        className={cn(
          !iconOnly &&
            "focus-visible:ring-ring/50 bg-muted/70 hover:bg-muted data-[popup-open]:bg-muted flex h-7 min-w-20 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-[background-color,color,box-shadow,scale] duration-150 outline-none focus-visible:ring-3 active:scale-[0.97] disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100 max-md:h-8",
          className,
        )}
      >
        {iconOnly ? (
          <Languages className="size-4" />
        ) : (
          <>
            <Languages className="text-muted-foreground size-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">{localeNames[locale]}</span>
            <ChevronDown className="text-muted-foreground size-3.5 shrink-0 opacity-50 transition-transform duration-200 in-data-[popup-open]:rotate-180 motion-reduce:transition-none" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="end" className="min-w-40">
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
