"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Account {
  id: string;
  username: string;
  isActive: boolean;
  expiresAt: string;
  tokenRefreshedAt: string | null;
  lastSyncedAt: string | null;
}

interface AccountManagerLabels {
  lastSynced: string;
  switch: string;
  addAccount: string;
  accessTokenLabel: string;
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
  tokenValidUntil: string;
  tokenAutoRefreshed: string;
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

// Renewals are at most 60 days old, so month/day is unambiguous and keeps the
// metadata row from stacking three full dates.
function formatShortDate(date: string, dateLocale: string, timeZone: string) {
  return new Intl.DateTimeFormat(dateLocale, {
    timeZone,
    month: "numeric",
    day: "numeric",
  }).format(new Date(date));
}

function getDaysLeft(expiresAt: string, now: string) {
  return Math.ceil(
    (new Date(expiresAt).getTime() - new Date(now).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function TokenExpiryBadge({
  daysLeft,
  labels,
  expanded,
  onClick,
}: {
  daysLeft: number;
  labels: Pick<AccountManagerLabels, "tokenExpiresIn" | "tokenExpiresToday" | "tokenExpiredLabel">;
  expanded: boolean;
  onClick: () => void;
}) {
  if (daysLeft > 30) return null;

  const isExpired = daysLeft <= 0;
  const isToday = daysLeft === 1;
  const isCritical = daysLeft <= 7;

  let text: string;
  if (isExpired) text = labels.tokenExpiredLabel;
  else if (isToday) text = labels.tokenExpiresToday;
  else text = labels.tokenExpiresIn.replace("{days}", String(daysLeft));

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className={cn(
        "focus-visible:ring-ring/50 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium transition-[background-color,scale] duration-150 outline-none focus-visible:ring-2 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100",
        isCritical
          ? "bg-destructive/10 text-destructive hover:bg-destructive/15"
          : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50",
      )}
    >
      <AlertTriangle className="size-3 shrink-0" />
      {text}
    </button>
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
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  // One transition per action, so only the pressed control shows progress.
  const [switching, startSwitch] = useTransition();
  const [updating, startUpdate] = useTransition();
  const [adding, startAdd] = useTransition();
  const [removing, startRemove] = useTransition();
  const addInputRef = useRef<HTMLInputElement>(null);
  const updateInputRef = useRef<HTMLInputElement>(null);

  function toggleUpdateForm(accountId: string) {
    setUpdatingId(updatingId === accountId ? null : accountId);
    setUpdateError(null);
    setShowAddForm(false);
  }

  function confirmRemove() {
    const target = removeTarget;
    if (!target) return;
    startRemove(async () => {
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
    setSwitchingId(id);
    startSwitch(async () => {
      try {
        const result = await switchAccountAction(id);
        if (result.shouldSync) startFirstSync(id, username);
      } catch {
        toast.error(labels.switchFailed);
      }
    });
  }

  // onSubmit, not a form action: an action would clear a rejected token.
  function handleUpdateToken(accountId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setUpdateError(null);
    startUpdate(async () => {
      const result = await updateTokenAction(accountId, formData);
      if (result.error) {
        setUpdateError(result.error);
        updateInputRef.current?.focus();
        updateInputRef.current?.select();
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

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setAddError(null);
    startAdd(async () => {
      const result = await addAccountAction(formData);
      if (result.error) {
        setAddError(result.error);
        addInputRef.current?.focus();
        addInputRef.current?.select();
      } else {
        toast.success(labels.connected.replace("{username}", result.username ?? ""));
        setShowAddForm(false);
        form.reset();
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
          {accounts.map((account) => {
            const daysLeft = getDaysLeft(account.expiresAt, now);
            const isUpdating = updatingId === account.id;
            const rowSwitching = switching && switchingId === account.id;
            const rowUpdating = updating && isUpdating;
            const rowError = isUpdating ? updateError : null;
            const inputId = `accessToken-${account.id}`;
            return (
              <div key={account.id} className="bg-muted/40 w-full rounded-xl">
                <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {account.isActive && (
                      <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">@{account.username}</p>
                        <TokenExpiryBadge
                          daysLeft={daysLeft}
                          labels={labels}
                          expanded={isUpdating}
                          onClick={() => toggleUpdateForm(account.id)}
                        />
                      </div>
                      {/* One wrapping metadata row instead of stacked lines —
                        sync and token facts sit side by side when there's
                        room and only break apart on narrow screens. */}
                      <div className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
                        {account.lastSyncedAt && (
                          <span>
                            {labels.lastSynced}{" "}
                            {formatDate(account.lastSyncedAt, dateLocale ?? "en-US", timeZone)}
                          </span>
                        )}
                        <span>
                          {labels.tokenValidUntil.replace(
                            "{date}",
                            formatDate(account.expiresAt, dateLocale ?? "en-US", timeZone),
                          )}
                          {account.tokenRefreshedAt &&
                            ` · ${labels.tokenAutoRefreshed.replace(
                              "{date}",
                              formatShortDate(
                                account.tokenRefreshedAt,
                                dateLocale ?? "en-US",
                                timeZone,
                              ),
                            )}`}
                        </span>
                      </div>
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
                        disabled={switching}
                      >
                        {rowSwitching && (
                          <RefreshCw className="mr-1.5 size-3 animate-spin motion-reduce:animate-none" />
                        )}
                        {labels.switch}
                      </Button>
                    )}
                    {daysLeft <= 7 ? (
                      <button
                        type="button"
                        aria-expanded={isUpdating}
                        onClick={() => toggleUpdateForm(account.id)}
                        disabled={rowUpdating}
                        className="bg-tint/12 text-tint hover:bg-tint/18 focus-visible:ring-ring/50 inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition-[background-color,scale] duration-150 outline-none focus-visible:ring-3 active:scale-[0.96] disabled:opacity-60 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100"
                      >
                        {labels.updateToken}
                      </button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground size-8 rounded-full"
                        title={labels.updateToken}
                        aria-label={labels.updateToken}
                        aria-expanded={isUpdating}
                        onClick={() => toggleUpdateForm(account.id)}
                        disabled={rowUpdating}
                      >
                        <KeyRound className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive size-8 rounded-full"
                      title={labels.remove}
                      aria-label={labels.remove}
                      onClick={() => setRemoveTarget(account)}
                      disabled={rowSwitching || rowUpdating}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <Collapse open={isUpdating}>
                  <form
                    onSubmit={(event) => handleUpdateToken(account.id, event)}
                    className="space-y-3 border-t px-4 py-3"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor={inputId} className="text-sm">
                        {labels.accessTokenLabel}
                      </Label>
                      <Input
                        ref={isUpdating ? updateInputRef : undefined}
                        id={inputId}
                        name="accessToken"
                        type="password"
                        placeholder={labels.accessTokenPlaceholder}
                        autoFocus
                        readOnly={rowUpdating}
                        aria-invalid={Boolean(rowError)}
                        aria-describedby={
                          rowError ? `${inputId}-error ${inputId}-help` : `${inputId}-help`
                        }
                        onChange={() => rowError && setUpdateError(null)}
                      />
                      {rowError && (
                        <p id={`${inputId}-error`} className="text-destructive text-xs">
                          {rowError}
                        </p>
                      )}
                      <p id={`${inputId}-help`} className="text-muted-foreground text-xs">
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
                      <Button
                        type="submit"
                        size="sm"
                        className="rounded-full"
                        disabled={rowUpdating}
                      >
                        {rowUpdating ? (
                          <>
                            <RefreshCw className="mr-1.5 size-3 animate-spin motion-reduce:animate-none" />
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
                        onClick={() => toggleUpdateForm(account.id)}
                        disabled={rowUpdating}
                      >
                        {labels.cancel}
                      </Button>
                    </div>
                  </form>
                </Collapse>
              </div>
            );
          })}
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
              setAddError(null);
              setUpdatingId(null);
            }}
            className="bg-muted/40 hover:bg-muted/70 focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-[background-color,scale] duration-150 outline-none focus-visible:ring-3 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <Plus className="text-muted-foreground size-4 shrink-0" />
            {labels.addAccount}
          </button>
        )}
        <Collapse open={showAddForm}>
          <form onSubmit={handleAdd} className="bg-muted/40 w-full space-y-3 rounded-xl p-4">
            <div className="space-y-1.5">
              <Label htmlFor="accessToken" className="text-sm">
                {labels.accessTokenLabel}
              </Label>
              <Input
                ref={addInputRef}
                id="accessToken"
                name="accessToken"
                type="password"
                placeholder={labels.accessTokenPlaceholder}
                autoFocus
                readOnly={adding}
                aria-invalid={Boolean(addError)}
                aria-describedby={
                  addError ? "accessToken-error accessToken-help" : "accessToken-help"
                }
                onChange={() => addError && setAddError(null)}
              />
              {addError && (
                <p id="accessToken-error" className="text-destructive text-xs">
                  {addError}
                </p>
              )}
              <p id="accessToken-help" className="text-muted-foreground text-xs">
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
              <Button type="submit" size="sm" className="rounded-full" disabled={adding}>
                {adding ? (
                  <>
                    <RefreshCw className="mr-1.5 size-3 animate-spin motion-reduce:animate-none" />
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
                onClick={() => {
                  setShowAddForm(false);
                  setAddError(null);
                }}
                disabled={adding}
              >
                {labels.cancel}
              </Button>
            </div>
          </form>
        </Collapse>
      </div>

      {/* Destructive confirmation: focus lands on Cancel, the destructive
          action is styled as such and never the default. */}
      <Dialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && !removing && setRemoveTarget(null)}
      >
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
              disabled={removing}
            >
              {labels.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              onClick={confirmRemove}
              disabled={removing}
            >
              {removing && (
                <RefreshCw className="mr-1.5 size-3.5 animate-spin motion-reduce:animate-none" />
              )}
              {labels.remove}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
