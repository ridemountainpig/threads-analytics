import "server-only";

import { db } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";
import { refreshLongLivedToken, TokenExpiredError } from "@/lib/threads-api";

/**
 * Renew once the token drops below this. Threads expires a long-lived token 60
 * days after its last renewal, so a 30-day trigger leaves a full month of
 * missed syncs before anything is actually lost, while keeping the token far
 * clear of the API's 24-hour minimum age.
 */
const REFRESH_WHEN_REMAINING_MS = 30 * 24 * 60 * 60 * 1000;

/** Back-off between attempts for an account that has never renewed successfully. */
const RECHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

export interface RefreshableAccount {
  id: string;
  expiresAt: Date;
  tokenRefreshedAt: Date | null;
  tokenCheckedAt: Date | null;
}

function shouldRefresh(account: RefreshableAccount): boolean {
  // Never renewed, so expiresAt is still the optimistic "+60 days from when it
  // was pasted" guess. A token generated weeks before being pasted in is
  // already partly spent, and nothing local can tell us by how much — so keep
  // attempting (throttled) until the API hands back a real expiry.
  if (!account.tokenRefreshedAt) {
    return (
      !account.tokenCheckedAt || Date.now() - account.tokenCheckedAt.getTime() > RECHECK_INTERVAL_MS
    );
  }
  return account.expiresAt.getTime() - Date.now() < REFRESH_WHEN_REMAINING_MS;
}

/**
 * Renews the stored token when it's due and returns the token this run should
 * use. A failed renewal is deliberately not fatal — the existing token stays
 * valid until its own expiry — but a 190 propagates so the caller can report
 * the account as needing reconnection.
 */
export async function ensureFreshToken(
  account: RefreshableAccount,
  currentToken: string,
): Promise<string> {
  if (!shouldRefresh(account)) return currentToken;

  const checkedAt = new Date();
  try {
    const refreshed = await refreshLongLivedToken(currentToken);

    // Renewal issues a new token string; storing the old one would leave the
    // account on a credential we no longer know the expiry of.
    await db.threadsAccount.update({
      where: { id: account.id },
      data: {
        accessToken: encryptToken(refreshed.accessToken),
        expiresAt: refreshed.expiresAt,
        tokenRefreshedAt: checkedAt,
        tokenCheckedAt: checkedAt,
      },
    });

    return refreshed.accessToken;
  } catch (err) {
    // Record the attempt even on failure, so a token that is still too young to
    // renew can't make every sync retry against the API.
    await db.threadsAccount
      .update({ where: { id: account.id }, data: { tokenCheckedAt: checkedAt } })
      .catch(() => {});

    if (err instanceof TokenExpiredError) throw err;

    console.warn(
      `[token-refresh] renewal failed for ${account.id}:`,
      err instanceof Error ? err.message : err,
    );
    return currentToken;
  }
}
