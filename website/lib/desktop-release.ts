import "server-only";

import { siteConfig } from "./site";

// Hourly, so a new release reaches the Mac page soon after it's published;
// this lowers the route's revalidate below the layout's daily one.
const ONE_HOUR = 3600;

// Named by .github/workflows/release.yml.
const assetPattern = /-macos-arm64\.zip$/;

export type DesktopRelease = {
  version: string;
  fileName: string;
  /** Direct link to the ZIP on GitHub Releases. */
  downloadUrl: string;
  bytes: number;
  /** The release page with its notes. */
  releaseUrl: string;
};

type GithubRelease = {
  tag_name: string;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  assets: { name: string; size: number; browser_download_url: string }[];
};

function toDownload(release: GithubRelease): DesktopRelease | null {
  if (release.draft || release.prerelease) return null;
  const asset = release.assets.find(({ name }) => assetPattern.test(name));
  if (!asset?.browser_download_url.startsWith(`${siteConfig.github}/releases/download/`)) {
    return null;
  }
  return {
    version: release.tag_name.replace(/^v/, ""),
    fileName: asset.name,
    downloadUrl: asset.browser_download_url,
    bytes: asset.size,
    releaseUrl: release.html_url,
  };
}

/**
 * The release GitHub marks Latest, which Promote Release sets and installed
 * apps read their update feed from; null when it ships no macOS ZIP or GitHub
 * can't be reached.
 */
export async function getDesktopRelease(): Promise<DesktopRelease | null> {
  const repo = new URL(siteConfig.github).pathname;
  try {
    const response = await fetch(`https://api.github.com/repos${repo}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: ONE_HOUR },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return toDownload((await response.json()) as GithubRelease);
  } catch {
    return null;
  }
}
