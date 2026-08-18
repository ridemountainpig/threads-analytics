"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2, CheckCircle2, RefreshCw, Plus, AlertTriangle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapse } from "@/components/ui/collapse";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addAccountAction,
  deleteAccountAction,
  switchAccountAction,
  updateTokenAction,
} from "@/actions/accounts";
import { syncAccountAction } from "@/actions/sync";
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
  tokenGuideLink: string;
  verifying: string;
  connect: string;
  cancel: string;
  removed: string;
  connected: string;
  remove: string;
  removeConfirmTitle: string;
  removeConfirmBody: string;
  removeFailed: string;
  switchFailed: string;
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

function formatDate(date: string, dateLocale: string, timeZone: string) {
  return new Intl.DateTimeFormat(dateLocale, {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(date));
}

function TokenExpiryBadge({
  expiresAt,
  labels,
  now,
}: {
  expiresAt: string;
  labels: Pick<AccountManagerLabels, "tokenExpiresIn" | "tokenExpiresToday" | "tokenExpiredLabel">;
  now: string;
}) {
  const daysLeft = Math.ceil(
    (new Date(expiresAt).getTime() - new Date(now).getTime()) / (1000 * 60 * 60 * 24),
  );

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
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium ${
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
  timeZone,
  now,
}: {
  accounts: Account[];
  labels: AccountManagerLabels;
  syncLabels: SyncResultLabels;
  dateLocale?: string;
  timeZone: string;
  now: string;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // Account queued for removal — confirmed through an in-app dialog rather
  // than the browser's confirm(), keeping the destructive step on-brand and
  // its focus handling accessible.
  const [removeTarget, setRemoveTarget] = useState<Account | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmRemove() {
    const target = removeTarget;
    if (!target) return;
    startTransition(async () => {
      try {
        await deleteAccountAction(target.id);
        toast.success(labels.removed.replace("{username}", target.username));
      } catch {
        toast.error(labels.removeFailed);
      } finally {
        setRemoveTarget(null);
      }
    });
  }

  function handleSwitch(id: string, username: string) {
    startTransition(async () => {
      try {
        const result = await switchAccountAction(id);
        if (result.shouldSync) startFirstSync(id, username);
      } catch {
        toast.error(labels.switchFailed);
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
  function startFirstSync(accountId: string, username: string) {
    const toastId = toast.loading(labels.firstSyncStarted.replace("{username}", username));
    void syncAccountAction(accountId)
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
        if (result.shouldSync && result.accountId) {
          startFirstSync(result.accountId, result.username ?? "");
        }
      }
    });
  }

  return (
    <div className="space-y-4">
      {accounts.length > 0 && (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id} className="bg-muted/40 w-full rounded-xl">
              <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  {account.isActive && <CheckCircle2 className="size-4 shrink-0 text-green-600" />}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">@{account.username}</p>
                      <TokenExpiryBadge expiresAt={account.expiresAt} labels={labels} now={now} />
                    </div>
                    {account.lastSyncedAt && (
                      <p className="text-muted-foreground text-xs">
                        {labels.lastSynced}{" "}
                        {formatDate(account.lastSyncedAt, dateLocale ?? "en-US", timeZone)}
                      </p>
                    )}
                  </div>
                </div>
                {/* Row controls follow the dashboard capsule grammar: gray
                    capsule for the secondary action, round ghost icon wells. */}
                <div className="flex shrink-0 items-center gap-2">
                  {!account.isActive && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleSwitch(account.id, account.username)}
                      disabled={pending}
                    >
                      {labels.switch}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground size-8 rounded-full"
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
                    className="text-muted-foreground hover:text-destructive size-8 rounded-full"
                    title={labels.remove}
                    onClick={() => setRemoveTarget(account)}
                    disabled={pending}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <Collapse open={updatingId === account.id}>
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
                    <p className="text-muted-foreground text-xs">
                      {labels.tokenHelp}{" "}
                      <Link
                        href="/dashboard/settings/token-guide"
                        className="text-tint underline underline-offset-2 hover:opacity-80"
                      >
                        {labels.tokenGuideLink}
                      </Link>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="rounded-full" disabled={pending}>
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
                      className="rounded-full"
                      onClick={() => setUpdatingId(null)}
                      disabled={pending}
                    >
                      {labels.cancel}
                    </Button>
                  </div>
                </form>
              </Collapse>
            </div>
          ))}
        </div>
      )}

      <div>
        {/* iOS Settings "Add Account" grammar: a list row in the same
            rounded-xl family as the account rows and the token-guide link
            above — full row height meets the 44pt touch target, unlike a
            capsule stretched into a thin bar. */}
        {!showAddForm && (
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true);
              setUpdatingId(null);
            }}
            className="bg-muted/40 hover:bg-muted/70 focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-[background-color,transform] duration-150 outline-none focus-visible:ring-3 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <Plus className="text-muted-foreground size-4 shrink-0" />
            {labels.addAccount}
          </button>
        )}
        <Collapse open={showAddForm}>
          <form action={handleAdd} className="bg-muted/40 w-full space-y-3 rounded-xl p-4">
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
              <p className="text-muted-foreground text-xs">
                {labels.tokenHelp}{" "}
                <Link
                  href="/dashboard/settings/token-guide"
                  className="text-tint underline underline-offset-2 hover:opacity-80"
                >
                  {labels.tokenGuideLink}
                </Link>
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="rounded-full" disabled={pending}>
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
                className="rounded-full"
                onClick={() => setShowAddForm(false)}
                disabled={pending}
              >
                {labels.cancel}
              </Button>
            </div>
          </form>
        </Collapse>
      </div>

      {/* Destructive confirmation: focus lands on Cancel, the destructive
          action is styled as such and never the default. */}
      <Dialog open={removeTarget !== null} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {labels.removeConfirmTitle.replace("{username}", removeTarget?.username ?? "")}
            </DialogTitle>
            <DialogDescription>{labels.removeConfirmBody}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => setRemoveTarget(null)}
              disabled={pending}
            >
              {labels.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              onClick={confirmRemove}
              disabled={pending}
            >
              {pending ? (
                <>
                  <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                  {labels.remove}
                </>
              ) : (
                labels.remove
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
