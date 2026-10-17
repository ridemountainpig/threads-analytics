"use client";

import { Check, Monitor, Moon, SunMedium } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeSwitcherProps {
  labels: { title: string; system: string; light: string; dark: string };
  className?: string;
}

// macOS's Appearance order.
const options = [
  { value: "system", icon: Monitor },
  { value: "light", icon: SunMedium },
  { value: "dark", icon: Moon },
] as const;

export default function ThemeSwitcher({ labels, className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const { icon: Icon } = options.find((option) => option.value === theme) ?? options[0];
  const label = `${labels.title}: ${labels[theme]}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={label} title={label} className={className}>
        <Icon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="min-w-36">
        {options.map(({ value, icon: OptionIcon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="flex items-center gap-2"
          >
            <Check
              className={cn("size-3.5 shrink-0", value === theme ? "opacity-100" : "opacity-0")}
            />
            <OptionIcon className="text-muted-foreground size-3.5" />
            <span className="truncate">{labels[value]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
