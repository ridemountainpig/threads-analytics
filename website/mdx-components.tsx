import type { MDXComponents } from "mdx/types";

// Required by @next/mdx. The article components are not registered here
// because links resolve against the page's locale: each page passes
// mdxArticleComponents(locale) to the MDX body it renders.
export function useMDXComponents(): MDXComponents {
  return {};
}
