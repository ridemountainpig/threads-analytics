// Pure helpers for comparing desktop release versions. Kept dependency-free
// so the desktop test suite can exercise them directly with Node's type
// stripping, outside of Next.
//
// Versions follow SemVer 2.0 precedence: X.Y.Z compared numerically, a
// pre-release (0.1.0-beta.1) sorts below its release (0.1.0), and pre-release
// identifiers compare numerically when both are numeric, otherwise as ASCII
// strings, with a shorter identifier list sorting first. A leading "v" (as in
// git tags) is ignored.

export interface ReleaseVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

const VERSION_PATTERN = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/;

export function parseReleaseVersion(value: string): ReleaseVersion | null {
  const match = VERSION_PATTERN.exec(value.trim());
  if (!match) return null;
  const prerelease = match[4] ? match[4].split(".") : [];
  if (prerelease.some((identifier) => identifier.length === 0)) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease,
  };
}

function compareIdentifiers(a: string, b: string): number {
  const aNumeric = /^\d+$/.test(a);
  const bNumeric = /^\d+$/.test(b);
  if (aNumeric && bNumeric) return Math.sign(Number(a) - Number(b));
  if (aNumeric) return -1;
  if (bNumeric) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

export function compareReleaseVersions(a: ReleaseVersion, b: ReleaseVersion): number {
  if (a.major !== b.major) return Math.sign(a.major - b.major);
  if (a.minor !== b.minor) return Math.sign(a.minor - b.minor);
  if (a.patch !== b.patch) return Math.sign(a.patch - b.patch);

  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0;
  if (a.prerelease.length === 0) return 1;
  if (b.prerelease.length === 0) return -1;

  const length = Math.min(a.prerelease.length, b.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const result = compareIdentifiers(a.prerelease[index], b.prerelease[index]);
    if (result !== 0) return result;
  }
  return Math.sign(a.prerelease.length - b.prerelease.length);
}

export function isNewerReleaseVersion(candidate: string, current: string): boolean {
  const candidateVersion = parseReleaseVersion(candidate);
  const currentVersion = parseReleaseVersion(current);
  if (!candidateVersion || !currentVersion) return false;
  return compareReleaseVersions(candidateVersion, currentVersion) > 0;
}

// The subset of a GitHub release the desktop update check reads.
export interface DesktopReleaseCandidate {
  tag_name: string;
  html_url: string;
  draft: boolean;
  assets: { name: string }[];
}

export const DESKTOP_ASSET_SUFFIX = "-macos-arm64.zip";

// The newest published release that actually ships a desktop build. Releases
// come from the API in creation order, which is not version order (a hotfix
// for an older line can be created later), so the highest version wins.
// Drafts and releases without a macOS asset (web-only releases) are skipped.
// Pre-release versions (0.2.0-beta.1) are only offered when includePrereleases
// is set, so a user on a stable build is never nudged onto a beta. GitHub's
// pre-release flag is ignored: the release workflow sets it by default even on
// plain X.Y.Z versions.
export function pickLatestDesktopRelease<T extends DesktopReleaseCandidate>(
  releases: T[],
  { includePrereleases = true }: { includePrereleases?: boolean } = {},
): { release: T; version: string } | null {
  let best: { release: T; version: string; parsed: ReleaseVersion } | null = null;

  for (const release of releases) {
    if (release.draft) continue;
    if (!release.assets.some((asset) => asset.name.endsWith(DESKTOP_ASSET_SUFFIX))) continue;
    const parsed = parseReleaseVersion(release.tag_name);
    if (!parsed) continue;
    if (!includePrereleases && parsed.prerelease.length > 0) continue;
    if (!best || compareReleaseVersions(parsed, best.parsed) > 0) {
      best = { release, version: release.tag_name.replace(/^v/, ""), parsed };
    }
  }

  return best ? { release: best.release, version: best.version } : null;
}
