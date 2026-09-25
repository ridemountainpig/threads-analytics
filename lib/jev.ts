import "server-only";

import { createHash } from "node:crypto";
import { experimental_evaluate as evaluate } from "ai";

export interface JevChoiceOption {
  key: string;
  description: string;
}

export interface JevChoiceResult {
  id: string;
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export type JevQuestion =
  | { type: "choice"; instructions: string; criteria: Record<string, string> }
  | { type: "boolean"; instructions: string }
  | { type: "score"; instructions: string; criteria: string[] };

export type JevAnswer =
  | { choice: string; probabilities: Record<string, number> }
  | { probability: number }
  | { score: number; probabilities: Record<string, number> };

const JEV_MODEL = "typesafe-ai/jev";
// Keyed by question hash + post id, so a re-ask after a client timeout (or the
// same analysis over a different date range) skips already-answered posts.
const CACHE_LIMIT = 60_000;
const answerCache = new Map<string, JevAnswer>();

function rememberAnswer(key: string, result: JevAnswer) {
  if (answerCache.size >= CACHE_LIMIT) {
    const oldest = answerCache.keys().next().value;
    if (oldest !== undefined) answerCache.delete(oldest);
  }
  answerCache.set(key, result);
}

interface Deferred {
  resolve: (answer: JevAnswer) => void;
  reject: (err: unknown) => void;
}

// A tool call can outlive the client that made it (a client-side timeout does
// not stop the server), so a retry must join the answers still being fetched
// instead of asking the same questions a second time.
const inFlight = new Map<string, Promise<JevAnswer>>();

function registerInFlight(cacheKey: string): Deferred {
  let settle!: Deferred;
  const promise = new Promise<JevAnswer>((resolve, reject) => {
    settle = { resolve, reject };
  });
  promise.catch(() => {});
  inFlight.set(cacheKey, promise);
  const done = () => {
    if (inFlight.get(cacheKey) === promise) inFlight.delete(cacheKey);
  };
  return {
    resolve: (answer) => {
      done();
      settle.resolve(answer);
    },
    reject: (err) => {
      done();
      settle.reject(err);
    },
  };
}

// Free-tier gateway keys are throttled per request, so pack many posts into
// each call (Jev answers all questions in parallel) and keep concurrency low —
// across all tool calls at once, since background work shares the same quota.
const BATCH_SIZE = 20;
const CONCURRENCY = 2;
const MAX_ATTEMPTS = 5;

let activeRequests = 0;
const requestQueue: Array<() => void> = [];

async function acquireRequestSlot() {
  if (activeRequests < CONCURRENCY) {
    activeRequests++;
    return;
  }
  await new Promise<void>((resolve) => requestQueue.push(resolve));
}

function releaseRequestSlot() {
  const next = requestQueue.shift();
  if (next) next();
  else activeRequests--;
}

function isRetryable(err: unknown): boolean {
  const text = err instanceof Error ? `${err.name} ${err.message}` : String(err);
  return /rate.?limit|high demand|overloaded|too many requests|unavailable|temporarily|429|5\d\d/i.test(
    text,
  );
}

function retryAfterMs(err: unknown): number | null {
  const withHeaders = err as {
    responseHeaders?: Record<string, string>;
    cause?: { responseHeaders?: Record<string, string> };
  };
  const value = (withHeaders.cause?.responseHeaders ?? withHeaders.responseHeaders)?.[
    "retry-after"
  ];
  const seconds = value ? Number(value) : NaN;
  return Number.isFinite(seconds) ? seconds * 1000 : null;
}

async function withBackoff<T>(run: () => Promise<T>, cancelled: () => boolean): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (err) {
      if (cancelled() || attempt >= MAX_ATTEMPTS || !isRetryable(err)) throw err;
      const delay =
        retryAfterMs(err) ?? Math.min(30_000, 1000 * 2 ** attempt) * (0.5 + Math.random());
      await new Promise((resolve) => setTimeout(resolve, delay + Math.random() * 1000));
      if (cancelled()) throw err;
    }
  }
}

export function jevConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN);
}

/**
 * Asks every question about every item. Returns, per item (in input order), a
 * map from question key to answer. Each question counts as one slot of a
 * request batch, so three questions over 100 posts cost as much as one
 * question over 300. Pass a function to ask each item its own questions.
 */
export async function askAboutTexts<K extends string>(
  items: Array<{ id: string; text: string }>,
  questions: Record<K, JevQuestion> | ((itemIndex: number) => Partial<Record<K, JevQuestion>>),
): Promise<Array<Partial<Record<K, JevAnswer>>>> {
  const questionsFor = typeof questions === "function" ? questions : () => questions;
  const hashes = new Map<string, string>();
  const hashOf = (question: JevQuestion) => {
    const json = JSON.stringify(question);
    let hash = hashes.get(json);
    if (!hash) {
      hash = createHash("sha256").update(json).digest("hex").slice(0, 16);
      hashes.set(json, hash);
    }
    return hash;
  };

  const results = items.map(() => ({}) as Partial<Record<K, JevAnswer>>);
  const pending: Array<{
    itemIndex: number;
    key: K;
    question: JevQuestion;
    cacheKey: string;
    settle: Deferred;
  }> = [];
  const waiting: Array<{ itemIndex: number; key: K; answer: Promise<JevAnswer> }> = [];
  items.forEach((item, itemIndex) => {
    const asked = questionsFor(itemIndex);
    for (const key of Object.keys(asked) as K[]) {
      const question = asked[key];
      if (!question) continue;
      const cacheKey = `${hashOf(question)}:${item.id}`;
      const hit = answerCache.get(cacheKey);
      const running = inFlight.get(cacheKey);
      if (hit) results[itemIndex][key] = hit;
      else if (running) waiting.push({ itemIndex, key, answer: running });
      else pending.push({ itemIndex, key, question, cacheKey, settle: registerInFlight(cacheKey) });
    }
  });

  const chunks: Array<typeof pending> = [];
  for (let start = 0; start < pending.length; start += BATCH_SIZE) {
    chunks.push(pending.slice(start, start + BATCH_SIZE));
  }

  let next = 0;
  // One chunk failing for good stops the other workers, so a rate-limited
  // call cannot keep burning the quota window from the background.
  let failed = false;
  const worker = async () => {
    while (!failed && next < chunks.length) {
      const chunk = chunks[next++];
      const itemIndexes = [...new Set(chunk.map((slot) => slot.itemIndex))];
      const localIndex = new Map(itemIndexes.map((itemIndex, i) => [itemIndex, i]));
      let answers;
      try {
        ({ answers } = await withBackoff(
          async () => {
            await acquireRequestSlot();
            try {
              return await evaluate({
                model: JEV_MODEL,
                state: itemIndexes.map((itemIndex, i) => ({
                  post: i,
                  text: items[itemIndex].text,
                })),
                questions: Object.fromEntries(
                  chunk.map(({ itemIndex, question }, q) => [
                    `q${q}`,
                    {
                      ...question,
                      instructions: `For the item where post=${localIndex.get(itemIndex)}: ${question.instructions}`,
                    },
                  ]),
                ),
                maxRetries: 0,
              });
            } finally {
              releaseRequestSlot();
            }
          },
          () => failed,
        ));
      } catch (err) {
        failed = true;
        throw err;
      }
      chunk.forEach((slot, q) => {
        const answer = answers[`q${q}`] as JevAnswer;
        results[slot.itemIndex][slot.key] = answer;
        rememberAnswer(slot.cacheKey, answer);
        slot.settle.resolve(answer);
      });
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, chunks.length) }, worker));
  } catch (err) {
    for (const slot of pending) slot.settle.reject(err);
    throw err;
  }
  for (const { itemIndex, key, answer } of waiting) {
    results[itemIndex][key] = await answer;
  }
  return results;
}

export async function classifyTexts(
  items: Array<{ id: string; text: string }>,
  question: string,
  options: JevChoiceOption[],
): Promise<JevChoiceResult[]> {
  const criteria = Object.fromEntries(options.map((o) => [o.key, o.description]));
  const answers = await askAboutTexts(items, {
    topic: { type: "choice", instructions: question, criteria },
  });
  return items.map((item, i) => {
    const answer = answers[i].topic as { choice: string; probabilities: Record<string, number> };
    return {
      id: item.id,
      choice: answer.choice,
      confidence: answer.probabilities[answer.choice] ?? 0,
      probabilities: answer.probabilities,
    };
  });
}

export const DEFAULT_MIN_CONFIDENCE = 0.6;
const MIN_FIT = 0.5;

export function categoryFitQuestion(description: string): JevQuestion {
  return {
    type: "boolean",
    instructions: `Does this post genuinely belong to this category: "${description}"? Answer no if it fits only loosely or partially.`,
  };
}

/** Probability, per item, that it really matches the description of the option it was assigned. */
export async function checkAssignedFit(
  items: Array<{ id: string; text: string }>,
  classified: Array<{ choice: string }>,
  options: JevChoiceOption[],
): Promise<number[]> {
  const descriptionOf = new Map(options.map((o) => [o.key, o.description]));
  const answers = await askAboutTexts(items, (i) => ({
    assigned: categoryFitQuestion(descriptionOf.get(classified[i].choice) ?? classified[i].choice),
  }));
  return answers.map((a) => (a.assigned as { probability: number } | undefined)?.probability ?? 0);
}

/**
 * Classifies items and labels each with its option, or "uncertain" when the
 * choice is low-confidence or the item fails a separate check against the
 * option's description. The check is needed because choice answers are
 * near-certain even for items that fit no option.
 */
export async function labelTexts(
  items: Array<{ id: string; text: string }>,
  question: string,
  options: JevChoiceOption[],
  { minConfidence = DEFAULT_MIN_CONFIDENCE, fitCheck = true } = {},
) {
  const classified = await classifyTexts(items, question, options);
  const fits = fitCheck ? await checkAssignedFit(items, classified, options) : null;
  let lowConfidence = 0;
  const misfitsByOption: Record<string, number> = {};
  const labels = classified.map((c, i) => {
    if (c.confidence < minConfidence) {
      lowConfidence++;
      return "uncertain";
    }
    if (fits && fits[i] < MIN_FIT) {
      misfitsByOption[c.choice] = (misfitsByOption[c.choice] ?? 0) + 1;
      return "uncertain";
    }
    return c.choice;
  });
  return {
    classified,
    labelById: new Map(items.map((item, i) => [item.id, labels[i]])),
    lowConfidence,
    misfitsByOption,
  };
}

export interface JevDraftAssessment {
  topic: string;
  topicConfidence: number;
  /** Probability the draft really matches its topic's description. */
  topicMatch: number;
  /** Low confidence or a failed match: benchmark the draft against its topic loosely. */
  topicUncertain: boolean;
  topicProbabilities: Record<string, number>;
  hookScore: number;
  hookProbabilities: Record<string, number>;
  ctaProbability: number;
}

export const HOOK_QUESTION: JevQuestion = {
  type: "score",
  instructions:
    "How compelling is the first sentence as a hook — does it make the reader want to keep reading?",
  criteria: [
    "Flat: states a fact or announcement with no pull to keep reading",
    "Mild: somewhat interesting but generic",
    "Good: opens with a pain point, a question to the reader, or a clear benefit",
    "Strong: hits a sharp pain point, a counterintuitive angle, or a high-stakes benefit",
  ],
};

export const CTA_QUESTION: JevQuestion = {
  type: "boolean",
  instructions:
    "Does the post end with a clear call to action, such as a question to readers or asking them to reply, repost, or follow a link?",
};

export async function assessDrafts(
  drafts: string[],
  question: string,
  options: JevChoiceOption[],
): Promise<JevDraftAssessment[]> {
  const criteria = Object.fromEntries(options.map((o) => [o.key, o.description]));
  const items = drafts.map((text) => ({
    id: `draft:${createHash("sha256").update(text).digest("hex").slice(0, 16)}`,
    text,
  }));
  const answers = await askAboutTexts(items, {
    topic: { type: "choice", instructions: question, criteria },
    hook: HOOK_QUESTION,
    cta: CTA_QUESTION,
  });
  const topics = answers.map(
    (answer) => answer.topic as { choice: string; probabilities: Record<string, number> },
  );
  const matches = await checkAssignedFit(items, topics, options);

  return answers.map((answer, i) => {
    const topic = topics[i];
    const hook = answer.hook as { score: number; probabilities: Record<string, number> };
    const cta = answer.cta as { probability: number };
    const topicConfidence = topic.probabilities[topic.choice] ?? 0;
    return {
      topic: topic.choice,
      topicConfidence,
      topicMatch: Math.round(matches[i] * 100) / 100,
      topicUncertain: topicConfidence < DEFAULT_MIN_CONFIDENCE || matches[i] < MIN_FIT,
      topicProbabilities: topic.probabilities,
      hookScore: Math.round(hook.score * 100) / 100,
      hookProbabilities: hook.probabilities,
      ctaProbability: Math.round(cta.probability * 100) / 100,
    };
  });
}

export async function assessDraft(
  draft: string,
  question: string,
  options: JevChoiceOption[],
): Promise<JevDraftAssessment> {
  const [assessment] = await assessDrafts([draft], question, options);
  return assessment;
}
