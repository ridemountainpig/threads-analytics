import "server-only";

import {
  computeGroupedPerformance,
  computeTextFeatureStats,
  type PostWithInsights,
  type TextFeatureStats,
} from "./analytics";
import { askAboutTexts, CTA_QUESTION, HOOK_QUESTION, type JevQuestion } from "./jev";
import {
  buildRetentionBenchmark,
  MIN_KIND_SAMPLE,
  type RetentionBenchmark,
} from "./thread-part-kind";

export const BOOLEAN_FEATURES = {
  personal_story: {
    type: "boolean",
    instructions:
      "Does the post tell a personal experience or story from the author's own life or work?",
  },
  concrete_numbers: {
    type: "boolean",
    instructions:
      "Does the post include specific numbers, data, prices, durations, or measurable results?",
  },
  contrarian: {
    type: "boolean",
    instructions:
      "Does the post take a contrarian, counterintuitive, or debatable stance that some readers would disagree with?",
  },
  actionable: {
    type: "boolean",
    instructions:
      "Does the post give the reader concrete, actionable advice or steps they could apply themselves?",
  },
  emotional: {
    type: "boolean",
    instructions:
      "Is the post primarily emotional — venting, vulnerability, gratitude, or excitement — rather than informational?",
  },
  cta: CTA_QUESTION,
} satisfies Record<string, JevQuestion>;

export type PostFeature = keyof typeof BOOLEAN_FEATURES | "hook";
export const POST_FEATURES = [
  ...(Object.keys(BOOLEAN_FEATURES) as Array<keyof typeof BOOLEAN_FEATURES>),
  "hook",
] as const satisfies readonly PostFeature[];

// Below this many posts on either side a lift is mostly noise.
const MIN_SIDE_SAMPLE = 5;
// Booleans whose probability sits near 0.5 are left out of both sides rather
// than forced into one, so a vague call cannot blur the comparison.
const BOOLEAN_MARGIN = 0.15;

function lift(withStats: TextFeatureStats, withoutStats: TextFeatureStats) {
  if (
    withStats.postCount < MIN_SIDE_SAMPLE ||
    withoutStats.postCount < MIN_SIDE_SAMPLE ||
    withoutStats.medianViews <= 0
  ) {
    return null;
  }
  return Math.round((withStats.medianViews / withoutStats.medianViews) * 100) / 100;
}

function example(post: PostWithInsights) {
  return {
    id: post.id,
    text: post.text.length > 100 ? `${post.text.slice(0, 100)}…` : post.text,
    views: post.views,
  };
}

export async function analyzePostFeatures(posts: PostWithInsights[], features: PostFeature[]) {
  const questions = Object.fromEntries(
    features.map((f) => [f, f === "hook" ? HOOK_QUESTION : BOOLEAN_FEATURES[f]]),
  ) as Record<PostFeature, JevQuestion>;
  const answers = await askAboutTexts(
    posts.map((p) => ({ id: p.id, text: p.text })),
    questions,
  );

  const booleanResults = features
    .filter((f): f is keyof typeof BOOLEAN_FEATURES => f !== "hook")
    .map((feature) => {
      const withPosts: PostWithInsights[] = [];
      const withoutPosts: PostWithInsights[] = [];
      posts.forEach((post, i) => {
        const { probability } = answers[i][feature] as { probability: number };
        if (probability >= 0.5 + BOOLEAN_MARGIN) withPosts.push(post);
        else if (probability <= 0.5 - BOOLEAN_MARGIN) withoutPosts.push(post);
      });
      const withFeature = computeTextFeatureStats(withPosts);
      const withoutFeature = computeTextFeatureStats(withoutPosts);
      return {
        feature,
        sharePct: posts.length > 0 ? Math.round((withPosts.length / posts.length) * 100) : 0,
        ambiguousCount: posts.length - withPosts.length - withoutPosts.length,
        medianViewsLift: lift(withFeature, withoutFeature),
        withFeature,
        withoutFeature,
        topExamples: [...withPosts]
          .sort((a, b) => b.views - a.views)
          .slice(0, 2)
          .map(example),
      };
    })
    .sort((a, b) => (b.medianViewsLift ?? 0) - (a.medianViewsLift ?? 0));

  let hook = null;
  if (features.includes("hook")) {
    const levelById = new Map(
      posts.map((post, i) => [
        post.id,
        `hook_${Math.round((answers[i].hook as { score: number }).score)}`,
      ]),
    );
    hook = {
      scale: "0 = flat announcement … 3 = sharp pain point / counterintuitive hook",
      levels: computeGroupedPerformance(posts, (p) => levelById.get(p.id) ?? "hook_0")
        .map(({ type, ...stats }) => ({ level: Number(type.slice(5)), ...stats }))
        .sort((a, b) => a.level - b.level),
    };
  }

  return { features: booleanResults, hook };
}

export const OPENER_QUESTION: JevQuestion = {
  type: "choice",
  instructions:
    "How does this first part of a multi-part thread lead the reader into the next part?",
  criteria: {
    none: "It reads as complete on its own; nothing signals there is more below.",
    pointer:
      "It explicitly points to more below (e.g. 👇, 'continued', 1/n, 'details in the thread') but already delivers its main point.",
    open_loop:
      "It withholds the payoff — teases a result, poses a question it does not answer, or cuts off mid-story — so the reader must open the next part to get it.",
  },
};

export interface ThreadOpenerInput {
  root: PostWithInsights;
  part2: { text: string; views: number };
}

export async function analyzeThreadOpeners(threads: ThreadOpenerInput[]) {
  const answers = await askAboutTexts(
    threads.map((t) => ({ id: t.root.id, text: t.root.text })),
    { opener: OPENER_QUESTION },
  );

  const groups = new Map<string, Array<ThreadOpenerInput & { retention: number }>>();
  threads.forEach((thread, i) => {
    const answer = answers[i].opener as { choice: string; probabilities: Record<string, number> };
    const confidence = answer.probabilities[answer.choice] ?? 0;
    const opener = confidence < 0.6 ? "uncertain" : answer.choice;
    const retention = (thread.part2.views / thread.root.views) * 100;
    groups.set(opener, [...(groups.get(opener) ?? []), { ...thread, retention }]);
  });

  const overall = buildRetentionBenchmark(
    threads.map((t) => ({ text: t.part2.text, views: t.part2.views, rootViews: t.root.views })),
  );
  const openers = [...groups.entries()]
    .map(([opener, members]) => {
      const benchmark: RetentionBenchmark = buildRetentionBenchmark(
        members.map((m) => ({ text: m.part2.text, views: m.part2.views, rootViews: m.root.views })),
      );
      return {
        opener,
        threadCount: members.length,
        medianRetentionPct: members.length >= MIN_KIND_SAMPLE ? benchmark.median : null,
        retentionByPart2Kind: benchmark.kinds,
        topExamples: [...members]
          .sort((a, b) => b.retention - a.retention)
          .slice(0, 2)
          .map((m) => ({
            ...example(m.root),
            part2Views: m.part2.views,
            retentionPct: Math.round(m.retention * 10) / 10,
          })),
      };
    })
    .sort((a, b) => (b.medianRetentionPct ?? -1) - (a.medianRetentionPct ?? -1));

  return { overallMedianRetentionPct: overall.median, overallByPart2Kind: overall.kinds, openers };
}
