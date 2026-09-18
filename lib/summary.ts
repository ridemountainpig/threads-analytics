export interface SummaryTemplates {
  summaryHeadlineUp: string;
  summaryHeadlineViewsUp: string;
  summaryHeadlineEngUp: string;
  summaryHeadlineDown: string;
  summaryHeadlineFlat: string;
  summaryPostsMore: string;
  summaryPostsFewer: string;
  summaryPostsSame: string;
  summaryFollowersUp: string;
  summaryFollowersDown: string;
  summaryFollowersFlat: string;
  summaryAudience: string;
  summaryTopPost: string;
}

export interface SummaryInput {
  totalViews: number;
  postCount: number;
  medianViews: number;
  engagementRate: number;
  /** Percent changes against the previous period; null when there is nothing to compare. */
  deltaViews: number | null;
  deltaEngRate: number | null;
  deltaPosts: number | null;
  followers: { current: number; net: number } | null;
  topCountry: { label: string; share: number } | null;
  topPost: { text: string; multiplier: number } | null;
}

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

function truncate(text: string, max = 40) {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}

// Rule-based so it can only say what the cards below already show.
export function buildSummary(input: SummaryInput, t: SummaryTemplates, locale: string): string[] {
  const n = (value: number) => Math.round(value).toLocaleString(locale);
  const pct = (value: number) =>
    Math.abs(value).toLocaleString(locale, { maximumFractionDigits: 1 });
  const sentences: string[] = [];

  const { deltaViews, deltaEngRate } = input;
  const sign = (value: number | null) => (value === null ? null : Math.sign(value));
  const v = sign(deltaViews);
  const e = sign(deltaEngRate);
  const vars = { views: pct(deltaViews ?? 0), eng: pct(deltaEngRate ?? 0) };
  // Exactly-zero deltas have no direction to narrate, so they fall back to the totals.
  if (v === null || e === null || v === 0 || e === 0) {
    sentences.push(
      fill(t.summaryHeadlineFlat, {
        views: n(input.totalViews),
        posts: n(input.postCount),
        eng: input.engagementRate.toFixed(2),
      }),
    );
  } else if (v > 0 && e > 0) {
    sentences.push(fill(t.summaryHeadlineUp, vars));
  } else if (v < 0 && e < 0) {
    sentences.push(fill(t.summaryHeadlineDown, vars));
  } else if (v > 0) {
    sentences.push(fill(t.summaryHeadlineViewsUp, vars));
  } else {
    sentences.push(fill(t.summaryHeadlineEngUp, vars));
  }

  if (input.postCount > 0) {
    const p = sign(input.deltaPosts);
    const postVars = {
      posts: n(input.postCount),
      delta: pct(input.deltaPosts ?? 0),
      median: n(input.medianViews),
    };
    sentences.push(
      fill(
        p === 1 ? t.summaryPostsMore : p === -1 ? t.summaryPostsFewer : t.summaryPostsSame,
        postVars,
      ),
    );
  }

  if (input.followers) {
    const { current, net } = input.followers;
    const fVars = { net: n(Math.abs(net)), total: n(current) };
    sentences.push(
      fill(
        net > 0 ? t.summaryFollowersUp : net < 0 ? t.summaryFollowersDown : t.summaryFollowersFlat,
        fVars,
      ),
    );
  }

  if (input.topCountry) {
    sentences.push(
      fill(t.summaryAudience, {
        country: input.topCountry.label,
        share: input.topCountry.share.toLocaleString(locale, { maximumFractionDigits: 1 }),
      }),
    );
  }

  if (input.topPost && input.topPost.multiplier >= 1.5 && input.topPost.text.trim()) {
    sentences.push(
      fill(t.summaryTopPost, {
        text: truncate(input.topPost.text),
        multiplier: input.topPost.multiplier.toFixed(1),
      }),
    );
  }

  return sentences;
}
