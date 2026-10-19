import "server-only";

import { siteConfig } from "./site";

// Hourly, so a new release reaches the Mac page soon after it's published;
// this lowers the route's revalidate below the layout's daily one.
const ONE_HOUR = 3600;

// Named by .github/workflows/release-desktop.yml.
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

/** The newest stable release that ships the macOS ZIP; null when GitHub can't be reached. */
export async function getDesktopRelease(): Promise<DesktopRelease | null> {
  const repo = new URL(siteConfig.github).pathname;
  try {
    const response = await fetch(`https://api.github.com/repos${repo}/releases?per_page=10`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: ONE_HOUR },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const releases = (await response.json()) as GithubRelease[];
    for (const release of releases) {
      if (release.draft || release.prerelease) continue;
      const asset = release.assets.find(({ name }) => assetPattern.test(name));
      if (!asset?.browser_download_url.startsWith(`${siteConfig.github}/releases/download/`)) {
        continue;
      }
      return {
        version: release.tag_name.replace(/^v/, ""),
        fileName: asset.name,
        downloadUrl: asset.browser_download_url,
        bytes: asset.size,
        releaseUrl: release.html_url,
      };
    }
    return null;
  } catch {
    return null;
  }
}
