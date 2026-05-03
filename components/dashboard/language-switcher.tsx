"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { setLocaleAction } from "@/actions/locale";
import { isLocale, localeNames, locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <Select
      value={locale}
      onValueChange={(nextLocale) => {
        if (isLocale(nextLocale)) setLocale(nextLocale);
      }}
      disabled={pending}
    >
      <SelectTrigger
        size="sm"
        aria-label="Language"
        className={cn(
          compact
            ? "bg-muted/70 min-w-20 border-0 text-xs font-medium shadow-none"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50 aria-expanded:bg-accent aria-expanded:text-accent-foreground h-auto w-full justify-start gap-2.5 rounded-md border-0 bg-transparent px-3 py-2 text-sm font-normal shadow-none *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1",
        )}
      >
        <Languages
          className={cn("shrink-0", compact ? "text-muted-foreground size-3.5" : "size-4")}
        />
        <SelectValue>
          {(value) => (isLocale(value) ? localeNames[value] : localeNames[locale])}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align={compact ? "end" : "start"} className={cn(compact && "min-w-24")}>
        {locales.map((item) => (
          <SelectItem key={item} value={item} label={localeNames[item]}>
            {localeNames[item]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
