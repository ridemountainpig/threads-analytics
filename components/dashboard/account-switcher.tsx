"use client";

import { useTransition } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { switchAccountAction } from "@/actions/accounts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  username: string;
  isActive: boolean;
}

export default function AccountSwitcher({
  accounts,
  label,
}: {
  accounts: Account[];
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const active = accounts.find((a) => a.isActive);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="text-muted-foreground hover:text-foreground inline-flex max-w-full items-center gap-1 rounded-sm text-left text-xs focus:outline-none"
        aria-label={label}
      >
        {pending ? <Loader2 className="size-3 shrink-0 animate-spin" /> : null}
        <span className="min-w-0 truncate">@{active?.username}</span>
        <ChevronDown className="size-3 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            disabled={account.isActive || pending}
            onClick={() => {
              if (!account.isActive) {
                startTransition(() => switchAccountAction(account.id));
              }
            }}
            className="flex items-center gap-2"
          >
            <Check
              className={cn("size-3.5 shrink-0", account.isActive ? "opacity-100" : "opacity-0")}
            />
            <span className="truncate">@{account.username}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
