import { unstable_cache } from "next/cache";
import { getUserInsights, type UserInsights } from "./threads-api";

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
