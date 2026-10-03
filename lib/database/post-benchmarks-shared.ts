import "server-only";

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

export const MIN_FEATURE_SAMPLE = 5;
export const toPct = (fraction: number | null) =>
  fraction === null ? 0 : Math.round(fraction * 10000) / 100;

export const buildFeature = (
  feature: TextFeature,
  withMedian: number | null,
  withoutMedian: number | null,
  withCount: number,
): FeatureDelta => {
  const wm = Math.round(withMedian ?? 0);
  const wom = Math.round(withoutMedian ?? 0);
  const deltaPct =
    withCount >= MIN_FEATURE_SAMPLE && wm > 0 && wom > 0 ? Math.round((wm / wom - 1) * 100) : null;
  return { feature, deltaPct, withMedian: wm, withoutMedian: wom, withCount };
};
