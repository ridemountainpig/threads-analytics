import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma";
import { decryptToken } from "@/lib/crypto";
import {
  DEMOGRAPHICS_MIN_FOLLOWERS,
  getPosts,
  getPostInsights,
  getUserReplies,
  getFollowerDemographics,
  getFollowersCount,
  MissingReplyPermissionError,
  TokenExpiredError,
  type FollowerDemographics,
  type PostInsights,
  type ThreadsPost,
  type ThreadsUserReply,
} from "@/lib/threads-api";
import { ensureFreshToken } from "@/lib/token-refresh";
import { DEFAULT_TZ, getDateString } from "@/lib/analytics";
import { dateKeyToUtcDate } from "@/lib/followers";
import { classifyThreadReplies, type ChainNode } from "@/lib/thread-replies";
import {
  isInsightsReadDue,
  isPostSnapshotDue,
  SNAPSHOT_WINDOW_MS,
} from "@/lib/post-metric-snapshots";
import { createLimiter, type Limiter } from "@/lib/concurrency";

/** Overlap re-read on each incremental /threads and /replies pull, in case an
 *  item landed right around the previous pull or its timestamp lagged the API
 *  index. */
const PULL_OVERLAP_MS = 24 * 60 * 60 * 1000;

// 200 pages × 100 ≈ 20k replies: an active commenter's full history on the
// first pull, and far more than any incremental pull should see.
const REPLIES_PAGE_LIMIT = 200;

/** Insights requests one account's sync keeps in flight at once. */
const INSIGHTS_CONCURRENCY = 10;

/** Rows read and written per transaction, so a large first import that fails
 *  partway keeps what it already stored. */
const WRITE_CHUNK_SIZE = 50;

/** Spacing between retries when a day's demographics fetch came back empty. */
const DEMOGRAPHICS_RETRY_INTERVAL_MS = 6 * 60 * 60 * 1000;

const METRIC_SELECT = {
  views: true,
  likes: true,
  replies: true,
  reposts: true,
  quotes: true,
  shares: true,
} as const;

function hasMetrics(m: PostInsights): boolean {
  return (
    m.views > 0 || m.likes > 0 || m.replies > 0 || m.reposts > 0 || m.quotes > 0 || m.shares > 0
  );
}

export interface SyncResult {
  /** Posts stored for the account once the run finished. */
  postsCount?: number;
  insightsFailed?: number;
  /** Thread continuations stored this run; absent when the pull was skipped. */
  threadRepliesCount?: number;
  /** Set when the token lacks threads_read_replies, so posts synced but thread
   *  parts couldn't be fetched. */
  repliesPermissionMissing?: boolean;
  error?: string;
}

interface SyncAccount {
  id: string;
  accessToken: string;
  expiresAt: Date;
  tokenRefreshedAt: Date | null;
  tokenCheckedAt: Date | null;
}

/**
 * Records the follower count (and demographics, when the profile qualifies) as
 * one row per calendar day. The API can't report either metric for a past date,
 * so a day missed here is lost for good.
 *
 * The count is re-read on every sync and overwrites the day's row, so once the
 * day is over the row holds its closing figure and the day-over-day delta is
 * the change that actually happened on that date. It is a single request, so
 * post syncing can be as frequent as the user likes.
 *
 * Demographics cost four requests, move by fractions of a point per day, and so
 * are fetched at most once per calendar day (plus a spaced retry when a fetch
 * came back empty). `capturedAt` marks the last demographics attempt, not the
 * last count reading.
 *
 * Syncs also run from cron, where the browser's time-zone cookie isn't
 * available, so days are bucketed by DEFAULT_TZ to keep the series consistent
 * no matter what triggered the sync.
 */
async function captureFollowerSnapshot(accountId: string, accessToken: string): Promise<void> {
  const reading = await readFollowerSnapshot(accountId, accessToken);
  if (reading) await storeFollowerSnapshot(accountId, reading);
}

interface FollowerReading {
  date: Date;
  followersCount: number;
  /** Whether this run requested demographics, successfully or not. */
  demographicsAttempted: boolean;
  demographics: FollowerDemographics | null;
}

async function readFollowerSnapshot(
  accountId: string,
  accessToken: string,
): Promise<FollowerReading | null> {
  const date = todaySnapshotDate();

  let existing: { followersCount: number; demographics: unknown; capturedAt: Date } | null = null;
  try {
    existing = await db.followerSnapshot.findUnique({
      where: { accountId_date: { accountId, date } },
      select: { followersCount: true, demographics: true, capturedAt: true },
    });
  } catch {
    // Treated as "not captured yet" — worst case demographics are fetched again.
  }

  const followersCount =
    (await getFollowersCount(accountId, accessToken)) ?? existing?.followersCount ?? null;
  if (followersCount === null) return null;

  // A failed demographics fetch is worth retrying — losing the day entirely to
  // one bad response would be worse — but not on every sync, or an hourly post
  // schedule would spend four requests an hour retrying a broken call.
  const retryDue =
    existing !== null &&
    existing.demographics === null &&
    Date.now() - existing.capturedAt.getTime() >= DEMOGRAPHICS_RETRY_INTERVAL_MS;
  const demographicsAttempted =
    followersCount >= DEMOGRAPHICS_MIN_FOLLOWERS && (existing === null || retryDue);
  const demographics = demographicsAttempted
    ? await getFollowerDemographics(accountId, accessToken)
    : null;

  return { date, followersCount, demographicsAttempted, demographics };
}

async function storeFollowerSnapshot(accountId: string, reading: FollowerReading): Promise<void> {
  const { date, followersCount, demographicsAttempted, demographics } = reading;

  // Prisma types Json columns as InputJsonValue, which a named interface never
  // structurally satisfies; the shape is validated on read by parseDemographics.
  const demographicsJson = demographics as unknown as Prisma.InputJsonValue;

  try {
    await db.followerSnapshot.upsert({
      where: { accountId_date: { accountId, date } },
      create: {
        accountId,
        date,
        followersCount,
        ...(demographics ? { demographics: demographicsJson } : {}),
      },
      // Demographics are only written when this run actually fetched them, so a
      // failed fetch can't blank out a good earlier snapshot. capturedAt only
      // moves on an attempt, so count-only syncs don't keep pushing the retry.
      update: {
        followersCount,
        ...(demographicsAttempted ? { capturedAt: new Date() } : {}),
        ...(demographics ? { demographics: demographicsJson } : {}),
      },
    });
  } catch (err) {
    console.warn(
      `[sync] follower snapshot failed for ${accountId}:`,
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * When each post still inside the snapshot window was last recorded. Null when
 * the lookup fails, which skips recording for this sync: a missed reading is
 * better than readings bunched up because the previous ones looked absent.
 */
async function loadLastPostSnapshotTimes(accountId: string): Promise<Map<string, Date> | null> {
  try {
    const rows = await db.postMetricSnapshot.groupBy({
      by: ["postId"],
      where: {
        post: { accountId, timestamp: { gte: new Date(Date.now() - SNAPSHOT_WINDOW_MS) } },
      },
      _max: { capturedAt: true },
    });
    const times = new Map<string, Date>();
    for (const row of rows) {
      if (row._max.capturedAt) times.set(row.postId, row._max.capturedAt);
    }
    return times;
  } catch (err) {
    console.warn(
      `[sync] post snapshot lookup failed for ${accountId}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

function todaySnapshotDate(): Date {
  return dateKeyToUtcDate(getDateString(new Date(), DEFAULT_TZ));
}

/**
 * Captures today's follower snapshot for an account that has none yet, without
 * the rest of a sync. Returns whether it called the API, so the caller can space
 * out retries while the API keeps failing.
 */
export async function captureMissingFollowerSnapshot(account: SyncAccount): Promise<boolean> {
  if (account.expiresAt < new Date()) return false;

  const existing = await db.followerSnapshot.findUnique({
    where: { accountId_date: { accountId: account.id, date: todaySnapshotDate() } },
    select: { accountId: true },
  });
  if (existing) return false;

  let accessToken: string;
  try {
    accessToken = decryptToken(account.accessToken);
  } catch {
    return false;
  }

  try {
    await captureFollowerSnapshot(account.id, accessToken);
  } catch (err) {
    console.warn(
      `[sync] follower snapshot failed for ${account.id}:`,
      err instanceof Error ? err.message : err,
    );
  }
  return true;
}

/** Attaches a handler right away, so a task left running while the caller
 *  awaits something else can't surface as an unhandled rejection. */
function settle<T>(promise: Promise<T>): Promise<PromiseSettledResult<T>> {
  return Promise.allSettled([promise]).then(([result]) => result);
}

interface Reading<T> {
  item: T;
  read: boolean;
  /** Null when not read, or when the read failed. */
  insights: PostInsights | null;
}

/**
 * Requests insights for the items `shouldRead` picks and hands them to `store`
 * WRITE_CHUNK_SIZE at a time, each chunk stored before the next is read.
 * Returns how many reads failed.
 */
async function readInChunks<T extends { id: string }>(
  items: T[],
  shouldRead: (item: T) => boolean,
  accessToken: string,
  limit: Limiter,
  store: (chunk: Reading<T>[], readAt: Date) => Promise<void>,
): Promise<number> {
  let failed = 0;
  for (let i = 0; i < items.length; i += WRITE_CHUNK_SIZE) {
    const chunk = await Promise.all(
      items.slice(i, i + WRITE_CHUNK_SIZE).map(async (item): Promise<Reading<T>> => {
        if (!shouldRead(item)) return { item, read: false, insights: null };
        const insights = await limit(() => getPostInsights(item.id, accessToken));
        if (!insights) failed++;
        return { item, read: true, insights };
      }),
    );
    await store(chunk, new Date());
  }
  return failed;
}

/**
 * The account's posts, newest first. With `from`, paging stops at the first
 * page that reaches back past it, so a later sync reads a page or two instead
 * of the whole history.
 */
async function listPosts(
  accountId: string,
  accessToken: string,
  from: Date | undefined,
): Promise<ThreadsPost[]> {
  const posts = new Map<string, ThreadsPost>();
  let cursor: string | undefined;

  do {
    const page = await getPosts(accountId, accessToken, cursor);
    for (const post of page.posts) posts.set(post.id, post);
    cursor = page.nextCursor;

    const oldest = page.posts[page.posts.length - 1];
    if (from && oldest && new Date(oldest.timestamp) < from) break;
  } while (cursor);

  return [...posts.values()];
}

type PostWork =
  | { kind: "new"; id: string; postedAt: Date; post: ThreadsPost }
  | { kind: "listed"; id: string; postedAt: Date; read: boolean; edited?: ThreadsPost }
  // Stored, still at zero, and older than the listing reached.
  | { kind: "unlisted"; id: string; postedAt: Date };

/**
 * Lists the account's posts and stores what changed. The first sync imports
 * the whole history. Later ones list back only to the snapshot window, as
 * older posts have settled — or to just before the previous sync, after a
 * longer gap — and write a post only when it is new, was edited, or got a
 * fresh reading. Insights are requested on the snapshot spacing, so a post a
 * few weeks old is re-read once a day rather than on every sync.
 */
async function syncPosts(
  accountId: string,
  accessToken: string,
  lastSyncedAt: Date | null,
  limit: Limiter,
): Promise<{ insightsFailed: number }> {
  const now = new Date();
  const listFrom = lastSyncedAt
    ? new Date(
        Math.min(now.getTime() - SNAPSHOT_WINDOW_MS, lastSyncedAt.getTime() - PULL_OVERLAP_MS),
      )
    : undefined;
  const listed = await listPosts(accountId, accessToken, listFrom);

  // A stored post inside the range the listing covered but missing from it was
  // deleted on Threads, so only posts older than that range are read by id.
  const oldestListed = listed.reduce<Date | undefined>((oldest, post) => {
    const postedAt = new Date(post.timestamp);
    return !oldest || postedAt < oldest ? postedAt : oldest;
  }, undefined);
  const coveredFrom = listFrom && oldestListed && oldestListed < listFrom ? oldestListed : listFrom;

  const [stored, unlistedAtZero, lastSnapshotAt] = await Promise.all([
    db.post.findMany({
      where: { id: { in: listed.map((p) => p.id) } },
      select: {
        id: true,
        text: true,
        mediaType: true,
        permalink: true,
        syncedAt: true,
        ...METRIC_SELECT,
      },
    }),
    coveredFrom
      ? db.post.findMany({
          where: {
            accountId,
            timestamp: { lt: coveredFrom },
            views: 0,
            likes: 0,
            replies: 0,
            reposts: 0,
            quotes: 0,
            shares: 0,
          },
          select: { id: true, timestamp: true, syncedAt: true },
        })
      : [],
    loadLastPostSnapshotTimes(accountId),
  ]);

  const storedById = new Map(stored.map((row) => [row.id, row]));
  const work: PostWork[] = [];
  for (const post of listed) {
    const postedAt = new Date(post.timestamp);
    const row = storedById.get(post.id);
    if (!row) {
      work.push({ kind: "new", id: post.id, postedAt, post });
      continue;
    }
    const edited =
      row.text !== post.text ||
      row.mediaType !== post.media_type ||
      row.permalink !== post.permalink;
    const read = isInsightsReadDue(postedAt, row.syncedAt, hasMetrics(row), now);
    if (read || edited) {
      work.push({ kind: "listed", id: post.id, postedAt, read, edited: edited ? post : undefined });
    }
  }
  for (const row of unlistedAtZero) {
    if (isInsightsReadDue(row.timestamp, row.syncedAt, false, now)) {
      work.push({ kind: "unlisted", id: row.id, postedAt: row.timestamp });
    }
  }

  const insightsFailed = await readInChunks(
    work,
    (item) => item.kind !== "listed" || item.read,
    accessToken,
    limit,
    async (chunk, readAt) => {
      const created = chunk.flatMap(({ item, insights }) =>
        item.kind === "new"
          ? [
              {
                id: item.id,
                accountId,
                text: item.post.text,
                timestamp: item.postedAt,
                mediaType: item.post.media_type,
                permalink: item.post.permalink,
                ...(insights ?? {}),
                // A failed first read leaves syncedAt at the post's own time, so
                // the next sync retries it instead of waiting out the zero spacing.
                syncedAt: insights ? readAt : item.postedAt,
              },
            ]
          : [],
      );
      const updates = chunk.flatMap(({ item, insights }) => {
        if (item.kind === "new") return [];
        const edited = item.kind === "listed" ? item.edited : undefined;
        // A failed read by id may mean the post is gone, so it still spaces out
        // the retries; a listed post exists, so its failure is retried next sync.
        const syncedAt = insights || item.kind === "unlisted" ? readAt : undefined;
        if (!edited && !syncedAt) return [];
        return [
          db.post.update({
            where: { id: item.id },
            data: {
              ...(edited
                ? { text: edited.text, mediaType: edited.media_type, permalink: edited.permalink }
                : {}),
              ...(insights ?? {}),
              ...(syncedAt ? { syncedAt } : {}),
            },
          }),
        ];
      });
      const writes = [
        ...(created.length > 0 ? [db.post.createMany({ data: created })] : []),
        ...updates,
      ];
      if (writes.length > 0) await db.$transaction(writes);

      // Only fresh readings are recorded; a failed insights fetch leaves a gap
      // rather than repeating the previous values.
      if (!lastSnapshotAt) return;
      const snapshots = chunk.flatMap(({ item, insights }) => {
        if (!insights || !isPostSnapshotDue(item.postedAt, lastSnapshotAt.get(item.id), readAt)) {
          return [];
        }
        lastSnapshotAt.set(item.id, readAt);
        return [{ postId: item.id, capturedAt: readAt, ...insights }];
      });
      if (snapshots.length === 0) return;
      try {
        await db.postMetricSnapshot.createMany({ data: snapshots });
      } catch (err) {
        console.warn(
          `[sync] post snapshots failed for ${accountId}:`,
          err instanceof Error ? err.message : err,
        );
      }
    },
  );

  return { insightsFailed };
}

interface RepliesPull {
  replies: ThreadsUserReply[];
  startedAt: Date;
}

/**
 * Every reply the account has written since a day before the last completed
 * pull; the whole reply history on the first one.
 */
async function pullReplies(
  accountId: string,
  accessToken: string,
  repliesSyncedAt: Date | null,
): Promise<RepliesPull> {
  const startedAt = new Date();
  const since = repliesSyncedAt
    ? Math.floor((repliesSyncedAt.getTime() - PULL_OVERLAP_MS) / 1000)
    : undefined;

  const replies: ThreadsUserReply[] = [];
  let after: string | undefined;
  for (let page = 0; page < REPLIES_PAGE_LIMIT; page++) {
    const pageResult = await getUserReplies(accountId, accessToken, { since, after });
    replies.push(...pageResult.replies);
    after = pageResult.nextCursor;
    if (!after) break;
  }

  return { replies, startedAt };
}

interface ThreadRepliesSyncResult {
  count: number;
  insightsFailed: number;
  permissionMissing: boolean;
  /** When the stored pull started; absent when nothing was stored, so the
   *  next sync pulls the same range again. */
  pulledAt?: Date;
}

/**
 * Stores the pulled replies that continue one of the account's root posts.
 * Every other reply (answers to commenters, comments under other accounts'
 * posts) is discarded — see classifyThreadReplies. Continuations found earlier
 * seed the chain, so a part added today under an old thread still resolves its
 * parent. Runs once the posts are stored, so every root a part points at
 * already exists.
 */
async function syncThreadReplies(
  accountId: string,
  accessToken: string,
  pull: RepliesPull,
  limit: Limiter,
): Promise<ThreadRepliesSyncResult> {
  const rootIds = [...new Set(pull.replies.map((r) => r.rootPostId))];
  const [rootRows, existing] = await Promise.all([
    db.post.findMany({
      where: { accountId, id: { in: rootIds } },
      select: { id: true, timestamp: true },
    }),
    db.threadReply.findMany({
      where: { accountId },
      select: {
        id: true,
        rootPostId: true,
        position: true,
        timestamp: true,
        syncedAt: true,
        ...METRIC_SELECT,
      },
    }),
  ]);

  const rootPosts = new Map(rootRows.map((p) => [p.id, p.timestamp]));
  const knownParts = new Map<string, ChainNode>(
    existing.map((r) => [
      r.id,
      { rootPostId: r.rootPostId, position: r.position, timestamp: r.timestamp },
    ]),
  );
  const parts = classifyThreadReplies(pull.replies, rootPosts, knownParts);

  const now = new Date();
  const existingById = new Map(existing.map((r) => [r.id, r]));
  const isDue = (row: (typeof existing)[number]) =>
    isInsightsReadDue(row.timestamp, row.syncedAt, hasMetrics(row), now);

  // An incremental pull only returns recent replies, so parts stored on
  // earlier runs are re-read alongside them on the same schedule.
  const pulledIds = new Set(parts.map((p) => p.reply.id));
  const work = [
    ...parts.map((part) => ({ id: part.reply.id, part, row: existingById.get(part.reply.id) })),
    ...existing
      .filter((row) => !pulledIds.has(row.id) && isDue(row))
      .map((row) => ({ id: row.id, part: undefined, row })),
  ];

  const insightsFailed = await readInChunks(
    work,
    ({ row }) => !row || isDue(row),
    accessToken,
    limit,
    async (chunk, readAt) => {
      const writes = chunk.flatMap(({ item: { part, row }, insights }) => {
        if (part) {
          const reply = part.reply;
          const chain = {
            repliedToId: reply.repliedToId,
            position: part.position,
            gapSeconds: part.gapSeconds,
            text: reply.text,
            mediaType: reply.media_type,
            permalink: reply.permalink,
          };
          return [
            db.threadReply.upsert({
              where: { id: reply.id },
              create: {
                id: reply.id,
                accountId,
                rootPostId: reply.rootPostId,
                timestamp: new Date(reply.timestamp),
                ...chain,
                ...(insights ?? {}),
                // As with posts, a failed first read is retried next sync.
                syncedAt: insights ? readAt : new Date(reply.timestamp),
              },
              update: { ...chain, ...(insights ?? {}), ...(insights ? { syncedAt: readAt } : {}) },
            }),
          ];
        }
        // Read by id, so a failure on a part still at zero may mean it's gone:
        // it still spaces out the retries.
        if (!row || (!insights && hasMetrics(row))) return [];
        return [
          db.threadReply.update({
            where: { id: row.id },
            data: { ...(insights ?? {}), syncedAt: readAt },
          }),
        ];
      });
      if (writes.length > 0) await db.$transaction(writes);
    },
  );

  return {
    count: parts.length,
    insightsFailed,
    permissionMissing: false,
    pulledAt: pull.startedAt,
  };
}

export async function syncAccount(account: SyncAccount): Promise<SyncResult> {
  if (account.expiresAt < new Date()) return { error: "token_expired" };

  let accessToken: string;
  try {
    accessToken = decryptToken(account.accessToken);
  } catch {
    return { error: "Account credentials are unavailable. Please reconnect this account." };
  }
  const userId = account.id;

  try {
    // Every sync — manual or scheduled — passes through here, making it the one
    // place that can keep the token alive and its recorded expiry honest.
    accessToken = await ensureFreshToken(account, accessToken);

    const syncState = await db.syncState.findUnique({
      where: { accountId: userId },
      select: { lastSyncedAt: true, repliesSyncedAt: true },
    });

    // Neither needs the post list, so both are fetched alongside it. Only the
    // reads overlap: on desktop SQLite a write issued while a posts transaction
    // is open would run inside it and roll back with it.
    const followers = settle(readFollowerSnapshot(userId, accessToken));
    const replies = settle(pullReplies(userId, accessToken, syncState?.repliesSyncedAt ?? null));
    const limit = createLimiter(INSIGHTS_CONCURRENCY);

    let posts: { insightsFailed: number };
    try {
      posts = await syncPosts(userId, accessToken, syncState?.lastSyncedAt ?? null, limit);
    } finally {
      // Nothing from this run may still be running once the sync lock is released.
      await Promise.all([followers, replies]);
    }

    const follower = await followers;
    if (follower.status === "rejected") throw follower.reason;
    if (follower.value) await storeFollowerSnapshot(userId, follower.value);

    // A failure here never fails the post sync: posts are already stored, and
    // the replies window isn't advanced, so the next sync retries the same range.
    let threadReplies: ThreadRepliesSyncResult | null = null;
    try {
      const pull = await replies;
      if (pull.status === "rejected") throw pull.reason;
      threadReplies = await syncThreadReplies(userId, accessToken, pull.value, limit);
    } catch (err) {
      if (err instanceof TokenExpiredError) throw err;
      if (err instanceof MissingReplyPermissionError) {
        threadReplies = { count: 0, insightsFailed: 0, permissionMissing: true };
      } else {
        console.warn(
          `[sync] thread replies failed for ${userId}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    // lastSyncedAt is only set once a whole run succeeds; until then the next
    // sync lists the full history again, so an interrupted first import resumes.
    const syncedAt = new Date();
    const repliesSyncedAt = threadReplies?.pulledAt
      ? { repliesSyncedAt: threadReplies.pulledAt }
      : {};
    await db.syncState.upsert({
      where: { accountId: userId },
      create: { accountId: userId, lastSyncedAt: syncedAt, ...repliesSyncedAt },
      update: { lastSyncedAt: syncedAt, ...repliesSyncedAt },
    });

    const postsCount = await db.post.count({ where: { accountId: userId } });
    const insightsFailed = posts.insightsFailed + (threadReplies?.insightsFailed ?? 0);

    return {
      postsCount,
      ...(insightsFailed > 0 ? { insightsFailed } : {}),
      ...(threadReplies && !threadReplies.permissionMissing
        ? { threadRepliesCount: threadReplies.count }
        : {}),
      ...(threadReplies?.permissionMissing ? { repliesPermissionMissing: true } : {}),
    };
  } catch (err) {
    if (err instanceof TokenExpiredError) return { error: "token_expired" };

    const message = err instanceof Error ? err.message : "Sync failed";
    return { error: message };
  }
}

type NamedSyncAccount = SyncAccount & { username: string };

/** Syncs each account in turn, logging the ones that fail. */
export async function syncAccounts(
  accounts: NamedSyncAccount[],
  onSynced?: (account: NamedSyncAccount, result: SyncResult) => void,
): Promise<void> {
  for (const account of accounts) {
    const result = await syncAccount(account);
    if (result.error) console.warn(`[sync] ${account.username}: ${result.error}`);
    onSynced?.(account, result);
  }
}
