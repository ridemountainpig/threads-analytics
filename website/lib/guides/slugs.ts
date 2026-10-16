/** Data-only guide registry shared with the request proxy. */
export const guideSlugs = ["threads-insights", "best-time-to-post", "reach-drop"] as const;

export type GuideSlug = (typeof guideSlugs)[number];

export function isGuideSlug(value: string): value is GuideSlug {
  return (guideSlugs as readonly string[]).includes(value);
}
