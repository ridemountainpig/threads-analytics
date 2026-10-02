import { unstable_cache } from "next/cache";
import { decryptToken } from "./crypto";
import { getUserInsights, TokenExpiredError, type UserInsights } from "./threads-api";
import { toUnix } from "./time-range";

export const USER_INSIGHTS_TAG = "user-insights";

const TTL_SECONDS = 5 * 60;

// since/until come from Date.now() for preset ranges, so the raw values would
// never hit the cache — round the key down to TTL-sized buckets.
const toBucket = (unix: number) => unix - (unix % TTL_SECONDS);

export function getUserInsightsCached(
  accountId: string,
  accessToken: string,
  since: number,
  until: number,
): Promise<UserInsights> {
  // The token is captured, not passed as an argument, to keep the secret out
  // of the persisted cache key.
  return unstable_cache(
    () => getUserInsights(accountId, accessToken, since, until),
    [USER_INSIGHTS_TAG, accountId, String(toBucket(since)), String(toBucket(until))],
    { revalidate: TTL_SECONDS, tags: [USER_INSIGHTS_TAG] },
  )();
}

/**
 * Total account-level views (every view the account received, older posts
 * included) for each range; null where Threads has no data or the fetch failed,
 * with a warning saying why.
 */
export async function getAccountViewTotals(
  account: { id: string; accessToken: string },
  ranges: Array<{ label: string; since: Date; until: Date }>,
  now = new Date(),
): Promise<{ totals: Array<number | null>; warning?: string }> {
  const totals: Array<number | null> = ranges.map(() => null);
  let token: string;
  try {
    token = decryptToken(account.accessToken);
  } catch {
    return { totals, warning: "Account credentials are unavailable, so accountViews is missing." };
  }

  const results = await Promise.allSettled(
    ranges.map(({ since, until }) =>
      getUserInsightsCached(account.id, token, toUnix(since), toUnix(until > now ? now : until)),
    ),
  );

  const failed: string[] = [];
  let tokenExpired = false;
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      const points = result.value.views;
      totals[i] = points.length > 0 ? points.reduce((sum, p) => sum + p.value, 0) : null;
    } else {
      if (result.reason instanceof TokenExpiredError) tokenExpired = true;
      else console.error("[user-insights] getUserInsights failed:", result.reason);
      failed.push(ranges[i].label);
    }
  });

  if (tokenExpired) {
    return {
      totals,
      warning:
        "The Threads access token has expired, so accountViews is missing until the account is reconnected in Settings.",
    };
  }
  if (failed.length > 0) {
    return {
      totals,
      warning: `Account-level views could not be fetched for ${failed.join(", ")}, so accountViews is missing there.`,
    };
  }
  return { totals };
}
