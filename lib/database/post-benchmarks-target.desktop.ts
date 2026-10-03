import "server-only";

import { db } from "@/lib/db";
import {
  buildFeature,
  toPct,
  type FeatureDelta,
  type PostBenchmarks,
} from "@/lib/database/post-benchmarks-shared";

// percentile_cont(0.5): linear interpolation between the two middle values.
function medianOf(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = (sorted.length - 1) / 2;
  return (sorted[Math.floor(mid)] + sorted[Math.ceil(mid)]) / 2;
}

// cume_dist(): fraction of rows with a value <= the row's value, ties included.
function cumeDistOf(values: number[]): Map<number, number> {
  const sorted = [...values].sort((a, b) => a - b);
  const dist = new Map<number, number>();
  for (let i = 0; i < sorted.length; i++) {
    // Later (higher) indexes of the same value overwrite earlier ones, leaving
    // the rank of the last occurrence — exactly cume_dist's tie handling.
    dist.set(sorted[i], (i + 1) / sorted.length);
  }
  return dist;
}

/**
 * Desktop counterpart of the Postgres implementation: SQLite has no
 * percentile_cont, and a single-user local database is small enough to
 * aggregate in process instead.
 */
export async function getPostBenchmarks(
  accountId: string,
  since: Date,
  until: Date,
  pageIds: string[],
): Promise<PostBenchmarks> {
  const posts = await db.post.findMany({
    where: {
      accountId,
      timestamp: { gte: since, lte: until },
      mediaType: { not: "REPOST_FACADE" },
    },
    select: {
      id: true,
      text: true,
      mediaType: true,
      views: true,
      likes: true,
      replies: true,
      reposts: true,
      quotes: true,
      shares: true,
    },
  });

  const viewed = posts.filter((p) => p.views > 0);
  const engagement = (p: (typeof posts)[number]) => p.likes + p.replies + p.reposts + p.quotes;

  const typeMedianViews: Record<string, number> = {};
  for (const post of posts) {
    if (post.mediaType in typeMedianViews) continue;
    const median = medianOf(
      viewed.filter((p) => p.mediaType === post.mediaType).map((p) => p.views),
    );
    typeMedianViews[post.mediaType] = Math.round(median ?? 0);
  }

  const rateMedian = (metric: (p: (typeof posts)[number]) => number) =>
    toPct(medianOf(viewed.map((p) => metric(p) / p.views)));
  const metricRateMedians = {
    likes: rateMedian((p) => p.likes),
    replies: rateMedian((p) => p.replies),
    reposts: rateMedian((p) => p.reposts),
    quotes: rateMedian((p) => p.quotes),
    shares: rateMedian((p) => p.shares),
  };

  const hasQuestion = (text: string) => /[?？]/.test(text);
  const hasLink = (text: string) => /https?:\/\//i.test(text);
  const featureMedian = (test: (text: string) => boolean, expected: boolean) =>
    medianOf(viewed.filter((p) => test(p.text) === expected).map((p) => p.views));
  const features: FeatureDelta[] = [
    buildFeature(
      "question",
      featureMedian(hasQuestion, true),
      featureMedian(hasQuestion, false),
      posts.filter((p) => hasQuestion(p.text)).length,
    ),
    buildFeature(
      "link",
      featureMedian(hasLink, true),
      featureMedian(hasLink, false),
      posts.filter((p) => hasLink(p.text)).length,
    ),
  ];

  const perPost: PostBenchmarks["perPost"] = {};
  if (pageIds.length) {
    const viewDist = cumeDistOf(posts.map((p) => p.views));
    const erOf = (p: (typeof posts)[number]) => engagement(p) / p.views;
    const erDist = cumeDistOf(viewed.map(erOf));
    const byId = new Map(posts.map((p) => [p.id, p]));
    for (const id of pageIds) {
      const post = byId.get(id);
      if (!post) continue;
      perPost[id] = {
        viewPercentile: Math.round((viewDist.get(post.views) ?? 0) * 100),
        engRatePercentile: post.views > 0 ? Math.round((erDist.get(erOf(post)) ?? 0) * 100) : null,
      };
    }
  }

  return {
    overallMedianViews: Math.round(medianOf(viewed.map((p) => p.views)) ?? 0),
    typeMedianViews,
    metricRateMedians,
    engagementRateMedian: toPct(medianOf(viewed.map((p) => engagement(p) / p.views))),
    features,
    perPost,
  };
}
