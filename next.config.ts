import type { NextConfig } from "next";

const isDesktopBuild = process.env.THREADS_ANALYTICS_TARGET === "desktop";
const targetExtension = isDesktopBuild ? ".desktop.ts" : ".web.ts";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    tsconfigPath: isDesktopBuild ? "tsconfig.desktop.json" : "tsconfig.json",
  },
  turbopack: {
    resolveExtensions: [targetExtension, ".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
  env: {
    NEXT_PUBLIC_ANALYTICS_TIME_ZONE: process.env.ANALYTICS_TIME_ZONE ?? "Asia/Taipei",
    NEXT_PUBLIC_RUNTIME_TARGET: isDesktopBuild ? "desktop" : "web",
    // The packaged desktop release version (desktop/scripts/build-next.mjs sets
    // it from app.json or the release workflow). Empty on web and dev builds,
    // which disables the desktop update check.
    NEXT_PUBLIC_DESKTOP_APP_VERSION: isDesktopBuild
      ? (process.env.THREADS_ANALYTICS_DESKTOP_VERSION ?? "")
      : "",
  },
  ...(isDesktopBuild
    ? {
        serverExternalPackages: ["better-sqlite3"],
        // The desktop app only serves loopback traffic and small local icons;
        // skipping optimization lets the staged runtime drop sharp, whose
        // libvips dylib exceeds the Native SDK packager's per-asset size cap.
        images: { unoptimized: true },
        // The standalone server lives inside the signed .app bundle. Persisting
        // the fetch/ISR cache to .next/cache would write into that bundle at
        // runtime and break its code signature, so keep the cache in memory.
        experimental: { isrFlushToDisk: false },
      }
    : {}),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
