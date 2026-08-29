import "server-only";

// Published images bake these in via Docker build args (see docker-publish.yml).
// Source builds, dev servers, and the desktop app run without them, which
// disables the update check entirely.
const commitSha = process.env.GIT_COMMIT_SHA;
const imageRepository = process.env.IMAGE_REPOSITORY?.toLowerCase();

// The digest check (update banner) and the version-URL scrape (version links)
// have different freshness needs, so each cache gets its own TTL.
const UPDATE_STATUS_CACHE_MS = 6 * 60 * 60 * 1000;
const UPDATE_STATUS_FAILURE_CACHE_MS = 15 * 60 * 1000;
const VERSION_URL_RETRY_MS = 60 * 60 * 1000;
const VERSION_URL_FAILURE_RETRY_MS = 15 * 60 * 1000;

// Accept both OCI and Docker manifest types so multi-arch index digests resolve.
const MANIFEST_ACCEPT = [
  "application/vnd.oci.image.index.v1+json",
  "application/vnd.docker.distribution.manifest.list.v2+json",
  "application/vnd.oci.image.manifest.v1+json",
  "application/vnd.docker.distribution.manifest.v2+json",
].join(", ");

export interface ImageUpdateStatus {
  supported: boolean;
  // True only when both digests resolved and were compared. A failed or
  // partial check reports checked: false so consumers can say "couldn't
  // check" instead of a false "you're up to date".
  checked: boolean;
  updateAvailable: boolean;
  currentTag: string | null;
  latestDigest: string | null;
}

const UNSUPPORTED_STATUS: ImageUpdateStatus = {
  supported: false,
  checked: false,
  updateAvailable: false,
  currentTag: null,
  latestDigest: null,
};

let cached: { expiresAt: number; status: ImageUpdateStatus } | null = null;

export function isImageUpdateCheckConfigured() {
  return Boolean(commitSha && imageRepository);
}

export interface ImageVersionLink {
  tag: string;
  url: string;
}

// GHCR version pages live at /pkgs/container/<name>/<numeric id>, and the id
// is assigned at publish time, so the deep link can only be recovered by
// scraping the public tagged-versions listing. That lookup must never gate a
// render: callers get the best URL known right now — the package overview
// until the deep link resolves in the background.
export function getImageVersionLink(): ImageVersionLink | null {
  if (!commitSha || !imageRepository) return null;
  if (!deepVersionUrl) refreshDeepVersionUrl(currentImageTag(commitSha));
  return {
    tag: currentImageTag(commitSha),
    url: deepVersionUrl ?? packageOverviewUrl(),
  };
}

// An image name may be nested (owner/repo/app → package "repo/app"); GitHub
// serves it under the owner's repo with the name encoded as one path segment.
function packageParts() {
  const [owner, ...rest] = (imageRepository ?? "").split("/");
  return { owner, repo: rest[0] ?? "", name: rest.join("/") };
}

function packageOverviewUrl() {
  const { owner, repo, name } = packageParts();
  return `https://github.com/${owner}/${repo}/pkgs/container/${encodeURIComponent(name)}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// The tag → version-id mapping is immutable once published, so a resolved deep
// URL is kept for the process lifetime; only misses and failures are retried.
let deepVersionUrl: string | null = null;
let nextDeepUrlAttemptAt = 0;
let deepUrlLookup: Promise<void> | null = null;

function refreshDeepVersionUrl(tag: string) {
  if (deepUrlLookup || Date.now() < nextDeepUrlAttemptAt) return;

  deepUrlLookup = (async () => {
    try {
      const response = await fetch(
        `${packageOverviewUrl()}/versions?filters%5Bversion_type%5D=tagged`,
        { cache: "no-store", signal: AbortSignal.timeout(4000) },
      );
      if (!response.ok) throw new Error(`versions page returned ${response.status}`);
      const html = await response.text();
      const match = html.match(
        new RegExp(
          `/(?:packages|pkgs)/container/${escapeRegExp(packageParts().name)}/(\\d+)\\?tag=${escapeRegExp(tag)}"`,
        ),
      );
      if (match) {
        deepVersionUrl = `${packageOverviewUrl()}/${match[1]}?tag=${tag}`;
      } else {
        // Tag aged off the first page or the markup changed; keep the overview
        // fallback and retry occasionally.
        nextDeepUrlAttemptAt = Date.now() + VERSION_URL_RETRY_MS;
      }
    } catch {
      nextDeepUrlAttemptAt = Date.now() + VERSION_URL_FAILURE_RETRY_MS;
    } finally {
      deepUrlLookup = null;
    }
  })();
}

// docker/metadata-action tags each publish as `sha-<short sha>` (7 chars).
function currentImageTag(sha: string) {
  return `sha-${sha.slice(0, 7)}`;
}

async function fetchManifestDigest(repository: string, tag: string, token: string) {
  const response = await fetch(`https://ghcr.io/v2/${repository}/manifests/${tag}`, {
    method: "HEAD",
    headers: { Authorization: `Bearer ${token}`, Accept: MANIFEST_ACCEPT },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return response.headers.get("docker-content-digest");
}

export async function getImageUpdateStatus(): Promise<ImageUpdateStatus> {
  if (!commitSha || !imageRepository) return UNSUPPORTED_STATUS;
  if (cached && cached.expiresAt > Date.now()) return cached.status;

  const tag = currentImageTag(commitSha);

  try {
    // Public GHCR packages allow anonymous pull tokens.
    const tokenResponse = await fetch(
      `https://ghcr.io/token?service=ghcr.io&scope=repository:${imageRepository}:pull`,
      { cache: "no-store" },
    );
    if (!tokenResponse.ok) throw new Error(`GHCR token request failed: ${tokenResponse.status}`);
    const { token } = (await tokenResponse.json()) as { token?: string };
    if (!token) throw new Error("GHCR token response missing token");

    const [latestDigest, currentDigest] = await Promise.all([
      fetchManifestDigest(imageRepository, "latest", token),
      fetchManifestDigest(imageRepository, tag, token),
    ]);

    const status: ImageUpdateStatus = {
      supported: true,
      // Only prompt when both digests resolved; a missing tag means we cannot tell.
      checked: Boolean(latestDigest && currentDigest),
      updateAvailable: Boolean(latestDigest && currentDigest && latestDigest !== currentDigest),
      currentTag: tag,
      latestDigest,
    };
    cached = { expiresAt: Date.now() + UPDATE_STATUS_CACHE_MS, status };
    return status;
  } catch {
    const status: ImageUpdateStatus = {
      supported: true,
      checked: false,
      updateAvailable: false,
      currentTag: tag,
      latestDigest: null,
    };
    cached = { expiresAt: Date.now() + UPDATE_STATUS_FAILURE_CACHE_MS, status };
    return status;
  }
}
