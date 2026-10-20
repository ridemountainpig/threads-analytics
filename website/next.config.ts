import { fileURLToPath } from "node:url";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The Zeabur deploy guide was retired; its indexed links land on the self-host guide.
  redirects: async () => [
    {
      source: "/:locale/deploy/zeabur-agent",
      destination: "/:locale/deploy/self-host",
      permanent: true,
    },
    { source: "/deploy/zeabur-agent", destination: "/deploy/self-host", permanent: true },
  ],
  experimental: {
    globalNotFound: true,
  },
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
};

// Long-form copy lives in content/**/*.mdx, imported by the pages that render
// it. Plugins are given by name or absolute path: Turbopack cannot pass
// functions to the MDX loader.
const withMDX = createMDX({
  options: {
    remarkPlugins: [
      "remark-gfm",
      // CommonMark won't close **bold** right after CJK punctuation
      // (**重點。**接著), which the zh-TW and ja copy does all the time.
      "remark-cjk-friendly",
    ],
    rehypePlugins: [fileURLToPath(new URL("./lib/mdx/rehype-article.mjs", import.meta.url))],
  },
});

export default withMDX(nextConfig);
