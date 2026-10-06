import "server-only";

import {
  releaseDownloadUrl,
  resolveDesktopUpdate,
  type DesktopReleaseCandidate,
} from "@/lib/release-version";
import type { UpdateStatusPayload, VersionLink } from "@/lib/update-status";

// Desktop builds bake their version in at build time (next.config.ts →
// desktop/scripts/build-next.mjs): the release workflow passes the full
// release version, and local packages fall back to the desktop/app.json
// version, so they check for updates too. Dev servers and web builds run
// without it, which disables the check entirely.
const currentVersion = process.env.NEXT_PUBLIC_DESKTOP_APP_VERSION || null;

const RELEASES_REPOSITORY = "ridemountainpig/threads-analytics";
const RELEASES_PAGE_URL = `https://github.com/${RELEASES_REPOSITORY}/releases`;
// Enough to look past a run of web-only or draft releases and still find the
// newest desktop build. Unauthenticated GitHub API calls are limited to 60
// per hour per IP, so the result is cached well beyond that window.
const RELEASES_API_URL = `https://api.github.com/repos/${RELEASES_REPOSITORY}/releases?per_page=20`;

const UPDATE_STATUS_CACHE_MS = 6 * 60 * 60 * 1000;
const UPDATE_STATUS_FAILURE_CACHE_MS = 15 * 60 * 1000;

const UNSUPPORTED_STATUS: UpdateStatusPayload = {
  supported: false,
  checked: false,
  updateAvailable: false,
  current: null,
  latest: null,
  download: null,
  updateId: null,
};

let cached: { expiresAt: number; status: UpdateStatusPayload } | null = null;

export function isDesktopUpdateCheckConfigured() {
  return currentVersion !== null;
}

export function getDesktopVersionLink(): VersionLink | null {
  if (!currentVersion) return null;
  return { label: currentVersion, url: `${RELEASES_PAGE_URL}/tag/v${currentVersion}` };
}

export async function getDesktopUpdateStatus(
  fetchImpl: typeof fetch = fetch,
): Promise<UpdateStatusPayload> {
  if (!currentVersion) return UNSUPPORTED_STATUS;
  if (cached && cached.expiresAt > Date.now()) return cached.status;

  const current = getDesktopVersionLink();

  try {
    const response = await fetchImpl(RELEASES_API_URL, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`GitHub releases request failed: ${response.status}`);
    const releases = (await response.json()) as DesktopReleaseCandidate[];
    if (!Array.isArray(releases)) throw new Error("GitHub releases response is not a list");

    const { checked, update } = resolveDesktopUpdate(releases, currentVersion);

    const status: UpdateStatusPayload = {
      supported: true,
      checked,
      updateAvailable: update !== null,
      current,
      latest: update ? { label: update.version, url: update.release.html_url } : null,
      download: update ? releaseDownloadUrl(update.asset, RELEASES_REPOSITORY) : null,
      updateId: update ? update.release.tag_name : null,
    };
    cached = { expiresAt: Date.now() + UPDATE_STATUS_CACHE_MS, status };
    return status;
  } catch {
    const status: UpdateStatusPayload = {
      supported: true,
      checked: false,
      updateAvailable: false,
      current,
      latest: null,
      download: null,
      updateId: null,
    };
    cached = { expiresAt: Date.now() + UPDATE_STATUS_FAILURE_CACHE_MS, status };
    return status;
  }
}
