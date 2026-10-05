import "server-only";

import { db } from "@/lib/db";
import {
  MILESTONE_AGE_MS,
  MILESTONE_KEYS,
  MIN_TYPICAL_PEERS,
  medianAtAge,
  ratio,
  readingAtAge,
  toGrowthPoints,
  type GrowthPoint,
  type MilestoneKey,
} from "@/lib/post-growth";

// Growth for the dashboard: a post's curve against the account's typical post
// at the same age. The typical post is the median of the most recent posts
// that have growth readings — whatever range the page shows — so the overview
// and the posts page always agree on it, and the work stays bounded however
// much history has piled up.

/** How many recent posts with growth readings the typical post is drawn from. */
export const TYPICAL_SAMPLE_SIZE = 60;

const HOUR_MS = 60 * 60 * 1000;
/** The chart covers a post's first week; growth has flattened by then. */
const CHART_WINDOW_MS = 7 * 24 * HOUR_MS;
/** Posts younger than this count as new on the overview. */
const NEW_POST_WINDOW_MS = 48 * HOUR_MS;

const SNAPSHOT_SELECT = {
  capturedAt: true,
  views: true,
  likes: true,
  replies: true,
  reposts: true,
  quotes: true,
  shares: true,
} as const;

const toHours = (ms: number) => Math.round((ms / HOUR_MS) * 100) / 100;

interface TrackedPost {
  id: string;
  text: string;
  permalink: string;
  postedAt: Date;
  points: GrowthPoint[];
}

async function loadRecentTrackedPosts(accountId: string, take: number): Promise<TrackedPost[]> {
  const rows = await db.post.findMany({
    where: { accountId, mediaType: { not: "REPOST_FACADE" }, metricSnapshots: { some: {} } },
    orderBy: { timestamp: "desc" },
    take,
    select: {
      id: true,
      text: true,
      permalink: true,
      timestamp: true,
      metricSnapshots: { orderBy: { capturedAt: "asc" }, select: SNAPSHOT_SELECT },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    permalink: row.permalink,
    postedAt: row.timestamp,
    points: toGrowthPoints(row.timestamp, row.metricSnapshots),
  }));
}

/** Views of the typical post at `ageMs`, or null with too few posts to say. */
function typicalViewsAt(peers: readonly TrackedPost[], ageMs: number): number | null {
  const { median, count } = medianAtAge(peers, ageMs, "views");
  return median === null || count < MIN_TYPICAL_PEERS ? null : Math.round(median);
}

export interface GrowthCurvePoint {
  ageHours: number;
  views: number;
  typical: number | null;
}

function curveAgainstTypical(
  points: readonly GrowthPoint[],
  peers: readonly TrackedPost[],
  untilMs: number,
): GrowthCurvePoint[] {
  // Publication is an all-zero reading, so every curve starts from the origin.
  const ages = [{ ageMs: 0, views: 0 }, ...points.filter((p) => p.ageMs <= untilMs)];
  return ages.map((p) => ({
    ageHours: toHours(p.ageMs),
    views: p.views,
    typical: typicalViewsAt(peers, p.ageMs),
  }));
}

export interface PostGrowthDetail {
  readings: number;
  /** How old the post is now. */
  ageHours: number;
  /** The post's views through its first week, with the typical post's alongside. */
  curve: GrowthCurvePoint[];
  /** Milestones the post has reached, each against the typical post. */
  milestones: {
    key: MilestoneKey;
    views: number | null;
    typical: number | null;
    vsTypical: number | null;
  }[];
  /** Posts the typical post was drawn from. */
  typicalSample: number;
}

export async function getPostGrowthDetail(
  accountId: string,
  postId: string,
  now = new Date(),
): Promise<PostGrowthDetail | null> {
  const post = await db.post.findFirst({
    where: { id: postId, accountId },
    select: {
      timestamp: true,
      metricSnapshots: { orderBy: { capturedAt: "asc" }, select: SNAPSHOT_SELECT },
    },
  });
  if (!post) return null;

  const ageMs = Math.max(0, now.getTime() - post.timestamp.getTime());
  const points = toGrowthPoints(post.timestamp, post.metricSnapshots);
  if (points.length === 0) {
    return { readings: 0, ageHours: toHours(ageMs), curve: [], milestones: [], typicalSample: 0 };
  }

  const peers = (await loadRecentTrackedPosts(accountId, TYPICAL_SAMPLE_SIZE + 1))
    .filter((p) => p.id !== postId)
    .slice(0, TYPICAL_SAMPLE_SIZE);

  const milestones = MILESTONE_KEYS.filter((key) => MILESTONE_AGE_MS[key] <= ageMs).map((key) => {
    const views = readingAtAge(points, MILESTONE_AGE_MS[key])?.views ?? null;
    const typical = typicalViewsAt(peers, MILESTONE_AGE_MS[key]);
    return { key, views, typical, vsTypical: views === null ? null : ratio(views, typical) };
  });

  return {
    readings: points.length,
    ageHours: toHours(ageMs),
    curve: curveAgainstTypical(points, peers, CHART_WINDOW_MS),
    milestones,
    typicalSample: peers.length,
  };
}

export interface NewPostPace {
  id: string;
  text: string;
  permalink: string;
  postedAt: string;
  /** Age of the post's latest reading, which the comparison is made at. */
  readingAgeHours: number;
  views: number;
  typical: number;
  vsTypical: number | null;
  curve: GrowthCurvePoint[];
}

/**
 * The newest posts (published in the last 48 hours) against the typical post
 * at the age of their latest reading. Posts the typical post can't speak for
 * yet — too few older posts were read at that age — are left out, so an
 * account without enough history simply gets an empty list.
 */
export async function getNewPostPace(
  accountId: string,
  { now = new Date(), limit = 3 }: { now?: Date; limit?: number } = {},
): Promise<{ posts: NewPostPace[]; typicalSample: number }> {
  const tracked = await loadRecentTrackedPosts(accountId, TYPICAL_SAMPLE_SIZE + limit);
  // Each new post is compared with the others, so one fewer than were loaded.
  const typicalSample = Math.min(Math.max(tracked.length - 1, 0), TYPICAL_SAMPLE_SIZE);
  const fresh = tracked.filter((p) => now.getTime() - p.postedAt.getTime() < NEW_POST_WINDOW_MS);

  const pace: NewPostPace[] = [];
  for (const post of fresh) {
    const latest = post.points[post.points.length - 1];
    if (!latest) continue;
    const peers = tracked.filter((p) => p !== post).slice(0, TYPICAL_SAMPLE_SIZE);
    const typical = typicalViewsAt(peers, latest.ageMs);
    if (typical === null) continue;
    pace.push({
      id: post.id,
      text: post.text,
      permalink: post.permalink,
      postedAt: post.postedAt.toISOString(),
      readingAgeHours: toHours(latest.ageMs),
      views: latest.views,
      typical,
      vsTypical: ratio(latest.views, typical),
      curve: curveAgainstTypical(post.points, peers, latest.ageMs),
    });
    if (pace.length === limit) break;
  }
  return { posts: pace, typicalSample };
}
