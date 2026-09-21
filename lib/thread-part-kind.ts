/**
 * What a thread's second part is made of. Retention is compared per kind, so
 * the classifier must be the one used for both the benchmark (server) and
 * the post being shown (client) — keep it pure and import it in both.
 */
export type ThreadPartKind = "link" | "linkText" | "text";

export const THREAD_PART_KINDS: readonly ThreadPartKind[] = ["link", "linkText", "text"];

/** Kinds with fewer threads than this don't get a median — too easy to misread. */
export const MIN_KIND_SAMPLE = 5;

const URL_PATTERN = /https?:\/\/\S+/gi;
// Punctuation, symbols (emoji included) and whitespace don't count as a note:
// "👇 https://…" is still a link-only part.
const NON_WORDS = /[\s\p{P}\p{S}]/gu;
const LINK_ONLY_MAX_CHARS = 1;

export function classifyThreadPartKind(text: string): ThreadPartKind {
  const withoutUrls = text.replace(URL_PATTERN, "");
  if (withoutUrls.length === text.length) return "text";
  const remainder = withoutUrls.replace(NON_WORDS, "");
  return remainder.length <= LINK_ONLY_MAX_CHARS ? "link" : "linkText";
}

export interface KindRetention {
  /** Median part-2 retention (%) for the kind; null below MIN_KIND_SAMPLE. */
  median: number | null;
  count: number;
}

export interface RetentionBenchmark {
  /** Median part-2 retention (%) across every thread in range; null without any. */
  median: number | null;
  kinds: Record<ThreadPartKind, KindRetention>;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(value * 10) / 10;
}

/** `parts` are second parts paired with their root's views; roots with no views are skipped. */
export function buildRetentionBenchmark(
  parts: Array<{ text: string; views: number; rootViews: number }>,
): RetentionBenchmark {
  const byKind: Record<ThreadPartKind, number[]> = { link: [], linkText: [], text: [] };
  const all: number[] = [];
  for (const part of parts) {
    if (part.rootViews <= 0) continue;
    const retention = (part.views / part.rootViews) * 100;
    all.push(retention);
    byKind[classifyThreadPartKind(part.text)].push(retention);
  }
  const kinds = {} as Record<ThreadPartKind, KindRetention>;
  for (const kind of THREAD_PART_KINDS) {
    const values = byKind[kind];
    kinds[kind] = {
      median: values.length >= MIN_KIND_SAMPLE ? median(values) : null,
      count: values.length,
    };
  }
  return { median: median(all), kinds };
}
