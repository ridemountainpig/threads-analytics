import "server-only";

// Published images bake these in via Docker build args (see docker-publish.yml).
// Source builds, dev servers, and the desktop app run without them, which
// disables the update check entirely.
const commitSha = process.env.GIT_COMMIT_SHA;
const imageRepository = process.env.IMAGE_REPOSITORY?.toLowerCase();

const SUCCESS_CACHE_MS = 6 * 60 * 60 * 1000;
const FAILURE_CACHE_MS = 15 * 60 * 1000;

// Accept both OCI and Docker manifest types so multi-arch index digests resolve.
const MANIFEST_ACCEPT = [
  "application/vnd.oci.image.index.v1+json",
  "application/vnd.docker.distribution.manifest.list.v2+json",
  "application/vnd.oci.image.manifest.v1+json",
  "application/vnd.docker.distribution.manifest.v2+json",
].join(", ");

export interface ImageUpdateStatus {
  supported: boolean;
  updateAvailable: boolean;
  currentTag: string | null;
  latestDigest: string | null;
}

const UNSUPPORTED_STATUS: ImageUpdateStatus = {
  supported: false,
  updateAvailable: false,
  currentTag: null,
  latestDigest: null,
};

let cached: { expiresAt: number; status: ImageUpdateStatus } | null = null;

export function isImageUpdateCheckConfigured() {
  return Boolean(commitSha && imageRepository);
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
      updateAvailable: Boolean(latestDigest && currentDigest && latestDigest !== currentDigest),
      currentTag: tag,
      latestDigest,
    };
    cached = { expiresAt: Date.now() + SUCCESS_CACHE_MS, status };
    return status;
  } catch {
    const status: ImageUpdateStatus = {
      supported: true,
      updateAvailable: false,
      currentTag: tag,
      latestDigest: null,
    };
    cached = { expiresAt: Date.now() + FAILURE_CACHE_MS, status };
    return status;
  }
}
