function resolveSiteUrl() {
  const configuredUrl = (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL)?.trim();

  if (!configuredUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SITE_URL is required for production builds so canonical, Open Graph, robots, and sitemap URLs never point to localhost.",
      );
    }

    return "http://localhost:3001";
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new Error("SITE_URL must be a valid absolute URL.");
  }

  const isPlaceholderHost =
    parsedUrl.hostname === "example.com" || parsedUrl.hostname.endsWith(".example.com");
  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname);

  if (process.env.NODE_ENV === "production") {
    if (parsedUrl.protocol !== "https:") {
      throw new Error("SITE_URL must use HTTPS in production.");
    }

    if (isPlaceholderHost || isLocalHost) {
      throw new Error("SITE_URL must use the real production hostname.");
    }
  }

  if (
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.pathname !== "/" ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error("SITE_URL must contain only the site origin without a path, query, or hash.");
  }

  return parsedUrl.origin;
}

// Canonical template links, also embedded in the agent prompts in lib/i18n.ts.
const railwayTemplate = "https://railway.com/deploy/zibjsX?referralCode=vPBCb4";
const zeaburTemplate = "https://zeabur.com/templates/XLGQAD?referralCode=ridemountainpig";

export const siteConfig = {
  name: "Threads Analytics",
  url: resolveSiteUrl(),
  github: "https://github.com/ridemountainpig/threads-analytics",
  package: "https://github.com/ridemountainpig/threads-analytics/pkgs/container/threads-analytics",
  creator: "https://yencheng.dev/",
  railway: `${railwayTemplate}&utm_medium=integration&utm_source=template&utm_campaign=generic`,
  railwayTemplate,
  railwayAgent: "https://railway.com/agents",
  zeabur: zeaburTemplate,
  zeaburAgent: "https://zeabur.com",
  vercelAgent: "https://vercel.com/docs/agent-resources/vercel-mcp",
} as const;
