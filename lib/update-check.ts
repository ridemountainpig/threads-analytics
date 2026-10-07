import "server-only";

import {
  getDesktopUpdateStatus,
  getDesktopVersionLink,
  isDesktopUpdateCheckConfigured,
} from "@/lib/desktop-update";
import {
  getImageUpdateStatus,
  getImageVersionLink,
  getResolvedImageVersionLink,
  isImageUpdateCheckConfigured,
  type ImageUpdateStatus,
  type ImageVersionLink,
} from "@/lib/image-update";
import { isDesktopApp } from "@/lib/runtime-target";
import type { UpdateStatusPayload, VersionLink } from "@/lib/update-status";

// One entry point for "is there a newer version?" so layouts, the settings
// About card, and the status API do not branch on the runtime target
// themselves. Web builds compare the running Docker image against GHCR; the
// desktop app compares its baked release version against GitHub Releases.

export function isUpdateCheckConfigured() {
  return isDesktopApp ? isDesktopUpdateCheckConfigured() : isImageUpdateCheckConfigured();
}

function toVersionLink(link: ImageVersionLink | null): VersionLink | null {
  return link ? { label: link.tag, url: link.url } : null;
}

// Best-known current version for server rendering; must never block on a
// network lookup (the GHCR deep link resolves in the background).
export function getCurrentVersionLink(): VersionLink | null {
  return isDesktopApp ? getDesktopVersionLink() : toVersionLink(getImageVersionLink());
}

function toImagePayload(
  status: ImageUpdateStatus,
  versionLink: ImageVersionLink | null,
): UpdateStatusPayload {
  return {
    supported: status.supported,
    checked: status.checked,
    updateAvailable: status.updateAvailable,
    current: toVersionLink(versionLink),
    // Image updates have no per-version page; the banner links to the guide.
    latest: null,
    download: null,
    updateId: status.updateAvailable ? status.latestDigest : null,
  };
}

// Awaited variant for the status API, where waiting on the lookups (bounded
// by their fetch timeouts) is acceptable.
export async function getResolvedUpdateStatus(): Promise<UpdateStatusPayload> {
  if (isDesktopApp) return getDesktopUpdateStatus();
  const [status, versionLink] = await Promise.all([
    getImageUpdateStatus(),
    getResolvedImageVersionLink(),
  ]);
  return toImagePayload(status, versionLink);
}
