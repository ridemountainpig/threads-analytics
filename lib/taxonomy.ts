import "server-only";

import {
  computeGroupedPerformance,
  getBaselineMedianViews,
  type PostWithInsights,
} from "./analytics";
import {
  askAboutTexts,
  categoryFitQuestion,
  classifyTexts,
  DEFAULT_MIN_CONFIDENCE,
  type JevChoiceOption,
} from "./jev";

const MAX_MISFIT_RATE_PCT = 20;
const MAX_CATEGORY_MISFIT_PCT = 30;
const MIN_SHARE_PCT = 5;
const MAX_SHARE_PCT = 40;
// Categories whose median views all sit within this band of the account
// median tell the user nothing about what performs.
const FLAT_SEPARATION_BAND = 0.2;
const MIN_GROUP_SIZE = 5;

function preview(text: string, length: number) {
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

/**
 * Picks posts spread evenly across the views distribution (top to bottom), so
 * a taxonomy drafted from the sample reflects what flops as well as what hits.
 */
export function stratifiedSample(posts: PostWithInsights[], size: number) {
  const withText = posts.filter((p) => p.text.trim().length > 0);
  const byViews = [...withText].sort((a, b) => b.views - a.views);
  if (byViews.length <= size) return byViews.map((p, i) => ({ post: p, rank: i }));
  const step = byViews.length / size;
  return Array.from({ length: size }, (_, i) => {
    const rank = Math.floor(i * step + step / 2);
    return { post: byViews[rank], rank };
  });
}

export function viewsBand(rank: number, total: number) {
  const pct = (rank / Math.max(total, 1)) * 100;
  if (pct < 20) return "top 20%";
  if (pct < 50) return "upper-middle";
  if (pct < 80) return "lower-middle";
  return "bottom 20%";
}

/**
 * Jev's choice answers are near-certain even for posts that fit no option, so
 * the choice probability alone cannot reveal a missing category or two
 * overlapping ones. Each post is therefore also asked, as a separate yes/no,
 * whether it really matches its assigned option (no = forced in) and its
 * runner-up (yes = the two options overlap).
 */
export async function evaluateTaxonomy(
  posts: PostWithInsights[],
  question: string,
  options: JevChoiceOption[],
) {
  const items = posts.map((p) => ({ id: p.id, text: p.text }));
  const classified = await classifyTexts(items, question, options);
  const descriptionOf = new Map(options.map((o) => [o.key, o.description]));
  const ranked = classified.map((c) =>
    Object.entries(c.probabilities)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key),
  );
  const fits = await askAboutTexts(items, (i) => {
    const [first, second] = ranked[i];
    return {
      assigned: categoryFitQuestion(descriptionOf.get(first) ?? first),
      ...(second && { runnerUp: categoryFitQuestion(descriptionOf.get(second) ?? second) }),
    };
  });

  const accountMedian = getBaselineMedianViews(posts);
  const total = posts.length;
  const labels = posts.map((_, i) => {
    const c = classified[i];
    const fitsAssigned = ((fits[i].assigned as { probability: number })?.probability ?? 0) >= 0.5;
    return {
      option: c.confidence < DEFAULT_MIN_CONFIDENCE ? "uncertain" : c.choice,
      misfit: c.confidence < DEFAULT_MIN_CONFIDENCE || !fitsAssigned,
      runnerUp: ranked[i][1] as string | undefined,
      fitsRunnerUp: ((fits[i].runnerUp as { probability: number })?.probability ?? 0) >= 0.5,
    };
  });
  const labelIndex = new Map(posts.map((p, i) => [p.id, i]));

  const performance = new Map(
    computeGroupedPerformance(posts, (p) => labels[labelIndex.get(p.id)!].option).map(
      ({ type, ...stats }) => [type, stats],
    ),
  );
  const categories = options.map(({ key }) => {
    const members = posts.filter((_, i) => labels[i].option === key);
    const misfits = members.filter((p) => labels[labelIndex.get(p.id)!].misfit).length;
    const stats = performance.get(key);
    return {
      option: key,
      postCount: members.length,
      sharePct: total > 0 ? Math.round((members.length / total) * 1000) / 10 : 0,
      misfitPct: members.length > 0 ? Math.round((misfits / members.length) * 100) : 0,
      medianViews: stats?.medianViews ?? 0,
      hitRate: stats?.hitRate ?? 0,
      engagementRate: stats?.engagementRate ?? 0,
      examples: [...members]
        .sort((a, b) => b.views - a.views)
        .slice(0, 2)
        .map((p) => ({ id: p.id, text: preview(p.text, 100), views: p.views })),
    };
  });

  const misfitPosts = posts.filter((_, i) => labels[i].misfit);
  const misfitRatePct = total > 0 ? Math.round((misfitPosts.length / total) * 1000) / 10 : 0;

  const overlapCounts = new Map<string, PostWithInsights[]>();
  posts.forEach((post, i) => {
    const { option, misfit, runnerUp, fitsRunnerUp } = labels[i];
    if (misfit || !runnerUp || !fitsRunnerUp) return;
    const pair = [option, runnerUp].sort().join(" + ");
    overlapCounts.set(pair, [...(overlapCounts.get(pair) ?? []), post]);
  });
  const minOverlap = Math.max(3, Math.ceil(total * 0.05));
  const overlaps = [...overlapCounts.entries()]
    .filter(([, members]) => members.length >= minOverlap)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([pair, members]) => ({
      options: pair.split(" + "),
      postCount: members.length,
      examples: members.slice(0, 2).map((p) => ({ id: p.id, text: preview(p.text, 100) })),
    }));

  const issues: string[] = [];
  if (misfitRatePct > MAX_MISFIT_RATE_PCT) {
    issues.push(
      `${misfitRatePct}% of posts do not really match the option they were put in — read misfitExamples for the category that is missing.`,
    );
  }
  for (const c of categories) {
    if (c.postCount >= MIN_GROUP_SIZE && c.misfitPct > MAX_CATEGORY_MISFIT_PCT) {
      issues.push(
        `'${c.option}' is acting as a catch-all: ${c.misfitPct}% of its posts do not match its description — split out what those posts share, or narrow the description.`,
      );
    }
    if (c.sharePct < MIN_SHARE_PCT) {
      issues.push(
        `'${c.option}' covers only ${c.sharePct}% of posts — merge it into a neighbour or drop it unless it is a category you deliberately want to track.`,
      );
    } else if (c.sharePct > MAX_SHARE_PCT && options.length >= 3) {
      issues.push(
        `'${c.option}' covers ${c.sharePct}% of posts — consider splitting it; a dominant category hides differences inside it.`,
      );
    }
  }
  for (const o of overlaps) {
    issues.push(
      `'${o.options[0]}' and '${o.options[1]}' both fit ${o.postCount} posts — sharpen their descriptions so they are mutually exclusive, or merge them.`,
    );
  }
  const sizeable = categories.filter((c) => c.postCount >= MIN_GROUP_SIZE);
  if (
    accountMedian > 0 &&
    sizeable.length >= 2 &&
    sizeable.every((c) => Math.abs(c.medianViews / accountMedian - 1) <= FLAT_SEPARATION_BAND)
  ) {
    issues.push(
      "Every category performs within ±20% of the account median — the split is clean but says little about what works; try cutting along a different axis (angle, format, audience) instead of subject.",
    );
  }

  return {
    postCount: total,
    accountMedianViews: accountMedian,
    ready: issues.length === 0,
    issues,
    misfitRatePct,
    categories,
    overlaps,
    misfitExamples: misfitPosts.slice(0, 8).map((p) => {
      const i = labelIndex.get(p.id)!;
      return {
        id: p.id,
        text: preview(p.text, 150),
        views: p.views,
        assignedTo: classified[i].choice,
      };
    }),
  };
}
