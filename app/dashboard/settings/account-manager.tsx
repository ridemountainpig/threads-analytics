"use client";

import { useState, useTransition } from "react";
import { Trash2, CheckCircle2, RefreshCw, Plus, AlertTriangle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addAccountAction,
  deleteAccountAction,
  switchAccountAction,
  updateTokenAction,
} from "@/actions/accounts";
import { syncDataAction } from "@/actions/sync";
import { toast } from "sonner";

interface Account {
  id: string;
  username: string;
  isActive: boolean;
  expiresAt: string;
  lastSyncedAt: string | null;
}

interface AccountManagerLabels {
  lastSynced: string;
  switch: string;
  addAccount: string;
  accessToken: string;
  accessTokenPlaceholder: string;
  tokenHelp: string;
  verifying: string;
  connect: string;
  cancel: string;
  removed: string;
  connected: string;
  removeConfirm: string;
  tokenExpiresIn: string;
  tokenExpiresToday: string;
  tokenExpiredLabel: string;
  updateToken: string;
  tokenUpdated: string;
  firstSyncStarted: string;
}

interface SyncResultLabels {
  tokenExpired: string;
  failed: string;
  synced: string;
}

function formatDate(date: string, dateLocale = "en-US") {
  return new Intl.DateTimeFormat(dateLocale, {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(date));
}

function TokenExpiryBadge({
  expiresAt,
  labels,
}: {
  expiresAt: string;
  labels: Pick<AccountManagerLabels, "tokenExpiresIn" | "tokenExpiresToday" | "tokenExpiredLabel">;
}) {
  const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysLeft > 30) return null;

  const isExpired = daysLeft <= 0;
  const isToday = daysLeft === 1;
  const isCritical = daysLeft <= 7;

  let text: string;
  if (isExpired) text = labels.tokenExpiredLabel;
  else if (isToday) text = labels.tokenExpiresToday;
  else text = labels.tokenExpiresIn.replace("{days}", String(daysLeft));

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${
        isExpired || isCritical
          ? "bg-destructive/10 text-destructive"
          : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
      }`}
    >
      <AlertTriangle className="size-3 shrink-0" />
      {text}
    </span>
  );
}

export default function AccountManager({
  accounts,
  labels,
  syncLabels,
  dateLocale,
}: {
  accounts: Account[];
  labels: AccountManagerLabels;
  syncLabels: SyncResultLabels;
  dateLocale?: string;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string, username: string) {
    if (!confirm(labels.removeConfirm.replace("{username}", username))) return;
    startTransition(async () => {
      try {
        await deleteAccountAction(id);
        toast.success(labels.removed.replace("{username}", username));
      } catch {
        toast.error("Failed to remove account. Please try again.");
      }
    });
  }

  function handleSwitch(id: string) {
    startTransition(async () => {
      try {
        await switchAccountAction(id);
      } catch {
        toast.error("Failed to switch account. Please try again.");
      }
    });
  }

  function handleUpdateToken(accountId: string, formData: FormData) {
    startTransition(async () => {
      const result = await updateTokenAction(accountId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(labels.tokenUpdated.replace("{username}", result.username ?? ""));
        setUpdatingId(null);
      }
    });
  }

  // Runs outside the transition so the form frees up immediately; the loading
  // toast tracks the sync until the server action resolves (may take minutes).
  function startFirstSync(username: string) {
    const toastId = toast.loading(labels.firstSyncStarted.replace("{username}", username));
    void syncDataAction()
      .then((result) => {
        if (result.error === "token_expired") {
          toast.error(syncLabels.tokenExpired, { id: toastId });
        } else if (result.error === "sync_in_progress") {
          // Another sync (e.g. the scheduler) is already fetching the data.
          toast.dismiss(toastId);
        } else if (result.error) {
          toast.error(`${syncLabels.failed} ${result.error}`, { id: toastId });
        } else {
          toast.success(syncLabels.synced.replace("{count}", String(result.postsCount)), {
            id: toastId,
          });
        }
      })
      .catch(() => toast.dismiss(toastId));
  }

  async function handleAdd(formData: FormData) {
    startTransition(async () => {
      const result = await addAccountAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(labels.connected.replace("{username}", result.username ?? ""));
        setShowAddForm(false);
        if (result.shouldSync) startFirstSync(result.username ?? "");
      }
    });
  }

  return (
    <div className="space-y-4">
      {accounts.length > 0 && (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id} className="bg-muted/30 w-full rounded-lg border">
              <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  {account.isActive && <CheckCircle2 className="size-4 shrink-0 text-green-600" />}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">@{account.username}</p>
                      <TokenExpiryBadge expiresAt={account.expiresAt} labels={labels} />
                    </div>
                    {account.lastSyncedAt && (
                      <p className="text-muted-foreground text-xs" suppressHydrationWarning>
                        {labels.lastSynced} {formatDate(account.lastSyncedAt, dateLocale)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!account.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSwitch(account.id)}
                      disabled={pending}
                    >
                      {labels.switch}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground size-8"
                    title={labels.updateToken}
                    onClick={() => {
                      setUpdatingId(updatingId === account.id ? null : account.id);
                      setShowAddForm(false);
                    }}
                    disabled={pending}
                  >
                    <KeyRound className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-8"
                    onClick={() => handleDelete(account.id, account.username)}
                    disabled={pending}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              {updatingId === account.id && (
                <form
                  action={(formData) => handleUpdateToken(account.id, formData)}
                  className="space-y-3 border-t px-4 py-3"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor={`accessToken-${account.id}`} className="text-sm">
                      {labels.accessToken}
                    </Label>
                    <Input
                      id={`accessToken-${account.id}`}
                      name="accessToken"
                      type="password"
                      placeholder={labels.accessTokenPlaceholder}
                      autoFocus
                      disabled={pending}
                    />
                    <p className="text-muted-foreground text-xs">{labels.tokenHelp}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={pending}>
                      {pending ? (
                        <>
                          <RefreshCw className="mr-1.5 size-3 animate-spin" />
                          {labels.verifying}
                        </>
                      ) : (
                        labels.updateToken
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUpdatingId(null)}
                      disabled={pending}
                    >
                      {labels.cancel}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {!showAddForm ? (
        <Button
          className="w-full justify-start sm:w-auto"
          variant="outline"
          size="sm"
          onClick={() => {
            setShowAddForm(true);
            setUpdatingId(null);
          }}
        >
          <Plus className="mr-1.5 size-3.5" />
          {labels.addAccount}
        </Button>
      ) : (
        <form action={handleAdd} className="w-full space-y-3 rounded-lg border p-4">
          <div className="space-y-1.5">
            <Label htmlFor="accessToken" className="text-sm">
              {labels.accessToken}
            </Label>
            <Input
              id="accessToken"
              name="accessToken"
              type="password"
              placeholder={labels.accessTokenPlaceholder}
              autoFocus
              disabled={pending}
            />
            <p className="text-muted-foreground text-xs">{labels.tokenHelp}</p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? (
                <>
                  <RefreshCw className="mr-1.5 size-3 animate-spin" />
                  {labels.verifying}
                </>
              ) : (
                labels.connect
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
              disabled={pending}
            >
              {labels.cancel}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
