import "server-only";

import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma";

export type TextFeature = "question" | "link";

export interface FeatureDelta {
  feature: TextFeature;
  /** Median-views change of posts with the feature vs without, in %. Null when
   *  there aren't enough posts with the feature to draw a fair comparison. */
  deltaPct: number | null;
  withMedian: number;
  withoutMedian: number;
  withCount: number;
}

export interface PostBenchmarks {
  overallMedianViews: number;
  /** Median views per media type — a fairer baseline than the global median. */
  typeMedianViews: Record<string, number>;
  /** Median per-post rate (as %) for each interaction, across the range. */
  metricRateMedians: {
    likes: number;
    replies: number;
    reposts: number;
    quotes: number;
    shares: number;
  };
  engagementRateMedian: number;
  features: FeatureDelta[];
  /** Per-post percentiles, keyed by post id, for the requested page of posts. */
  perPost: Record<string, { viewPercentile: number; engRatePercentile: number | null }>;
}

const MIN_FEATURE_SAMPLE = 5;
const toPct = (fraction: number | null) =>
  fraction === null ? 0 : Math.round(fraction * 10000) / 100;

/**
 * Computes the benchmarks the posts detail panel compares each post against.
 * Everything is aggregated in Postgres over the full range so we never load
 * every post into the app; only per-page percentiles depend on `pageIds`.
 */
export async function getPostBenchmarks(
  accountId: string,
  since: Date,
  until: Date,
  pageIds: string[],
): Promise<PostBenchmarks> {
  const range = Prisma.sql`"accountId" = ${accountId} AND "timestamp" >= ${since} AND "timestamp" <= ${until} AND "mediaType" <> 'REPOST_FACADE'`;

  const typeMediansQuery = db.$queryRaw<{ mediaType: string; median: number | null }[]>(Prisma.sql`
    SELECT "mediaType", percentile_cont(0.5) WITHIN GROUP (ORDER BY views) FILTER (WHERE views > 0) AS median
    FROM "Post" WHERE ${range} GROUP BY "mediaType"`);

  const ratesQuery = db.$queryRaw<
    {
      median_views: number | null;
      likes_rate: number | null;
      replies_rate: number | null;
      reposts_rate: number | null;
      quotes_rate: number | null;
      shares_rate: number | null;
      er: number | null;
    }[]
  >(Prisma.sql`
    SELECT
      percentile_cont(0.5) WITHIN GROUP (ORDER BY views) FILTER (WHERE views > 0) AS median_views,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY likes::float / views) FILTER (WHERE views > 0) AS likes_rate,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY replies::float / views) FILTER (WHERE views > 0) AS replies_rate,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY reposts::float / views) FILTER (WHERE views > 0) AS reposts_rate,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY quotes::float / views) FILTER (WHERE views > 0) AS quotes_rate,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY shares::float / views) FILTER (WHERE views > 0) AS shares_rate,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY (likes + replies + reposts + quotes)::float / views) FILTER (WHERE views > 0) AS er
    FROM "Post" WHERE ${range}`);

  const featuresQuery = db.$queryRaw<
    {
      q_with: number | null;
      q_without: number | null;
      q_count: number;
      l_with: number | null;
      l_without: number | null;
      l_count: number;
    }[]
  >(Prisma.sql`
    WITH f AS (
      SELECT views, (text ~* 'https?://') AS has_link, (text ~ '[?？]') AS has_question
      FROM "Post" WHERE ${range}
    )
    SELECT
      percentile_cont(0.5) WITHIN GROUP (ORDER BY views) FILTER (WHERE has_question AND views > 0) AS q_with,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY views) FILTER (WHERE (NOT has_question) AND views > 0) AS q_without,
      count(*) FILTER (WHERE has_question)::int AS q_count,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY views) FILTER (WHERE has_link AND views > 0) AS l_with,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY views) FILTER (WHERE (NOT has_link) AND views > 0) AS l_without,
      count(*) FILTER (WHERE has_link)::int AS l_count
    FROM f`);

  const percentilesQuery = pageIds.length
    ? db.$queryRaw<{ id: string; view_pct: number; er_pct: number | null }[]>(Prisma.sql`
        WITH v AS (
          SELECT id, cume_dist() OVER (ORDER BY views) AS cd FROM "Post" WHERE ${range}
        ),
        e AS (
          SELECT id, cume_dist() OVER (ORDER BY (likes + replies + reposts + quotes)::float / NULLIF(views, 0)) AS cd
          FROM "Post" WHERE ${range} AND views > 0
        )
        SELECT v.id, round(v.cd * 100)::int AS view_pct, round(e.cd * 100)::int AS er_pct
        FROM v LEFT JOIN e ON e.id = v.id
        WHERE v.id IN (${Prisma.join(pageIds)})`)
    : Promise.resolve([]);

  const [typeRows, rateRows, featureRows, pctRows] = await Promise.all([
    typeMediansQuery,
    ratesQuery,
    featuresQuery,
    percentilesQuery,
  ]);

  const typeMedianViews: Record<string, number> = {};
  for (const row of typeRows) {
    typeMedianViews[row.mediaType] = Math.round(row.median ?? 0);
  }

  const rates = rateRows[0];
  const metricRateMedians = {
    likes: toPct(rates?.likes_rate ?? null),
    replies: toPct(rates?.replies_rate ?? null),
    reposts: toPct(rates?.reposts_rate ?? null),
    quotes: toPct(rates?.quotes_rate ?? null),
    shares: toPct(rates?.shares_rate ?? null),
  };

  const fr = featureRows[0];
  const buildFeature = (
    feature: TextFeature,
    withMedian: number | null,
    withoutMedian: number | null,
    withCount: number,
  ): FeatureDelta => {
    const wm = Math.round(withMedian ?? 0);
    const wom = Math.round(withoutMedian ?? 0);
    const deltaPct =
      withCount >= MIN_FEATURE_SAMPLE && wm > 0 && wom > 0
        ? Math.round((wm / wom - 1) * 100)
        : null;
    return { feature, deltaPct, withMedian: wm, withoutMedian: wom, withCount };
  };
  const features: FeatureDelta[] = [
    buildFeature("question", fr?.q_with ?? null, fr?.q_without ?? null, fr?.q_count ?? 0),
    buildFeature("link", fr?.l_with ?? null, fr?.l_without ?? null, fr?.l_count ?? 0),
  ];

  const perPost: PostBenchmarks["perPost"] = {};
  for (const row of pctRows) {
    perPost[row.id] = { viewPercentile: row.view_pct, engRatePercentile: row.er_pct };
  }

  return {
    overallMedianViews: Math.round(rates?.median_views ?? 0),
    typeMedianViews,
    metricRateMedians,
    engagementRateMedian: toPct(rates?.er ?? null),
    features,
    perPost,
  };
}
