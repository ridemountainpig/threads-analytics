import type { MDXContent } from "mdx/types";
import type { GuideSlug } from "./guides";
import type { Locale } from "./locales";

// Loaders for the MDX bodies in content/. Import this only from server
// components: each template-literal import() bundles every matching .mdx file
// into whatever imports it, so a loader in a module client components use
// (lib/i18n, via the language menu) would ship every body to the browser.

/** A section heading, as collected by lib/mdx/rehype-article.mjs. */
export type ContentHeading = { depth: 2 | 3; id: string; text: string };

export type ContentModule = { default: MDXContent; headings: ContentHeading[] };

export function loadGuideBody(slug: GuideSlug, locale: Locale): Promise<ContentModule> {
  return import(`@/content/guides/${slug}/${locale}.mdx`);
}

export function loadSelfHostBody(locale: Locale): Promise<ContentModule> {
  return import(`@/content/self-host/${locale}.mdx`);
}
