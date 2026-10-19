import "server-only";

import { siteConfig } from "./site";

// Keep in sync with `revalidate` in app/[locale]/layout.tsx.
const ONE_DAY = 86400;

/** The repo's star count, refreshed daily; null when GitHub can't be reached. */
export async function getGithubStars(): Promise<number | null> {
  const repo = new URL(siteConfig.github).pathname;
  try {
    const response = await fetch(`https://api.github.com/repos${repo}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: ONE_DAY },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const { stargazers_count: stars } = (await response.json()) as { stargazers_count?: unknown };
    return typeof stars === "number" ? stars : null;
  } catch {
    return null;
  }
}

/** 51 → "51", 1234 → "1.2k". */
export function formatStars(stars: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
    .format(stars)
    .toLowerCase();
}
