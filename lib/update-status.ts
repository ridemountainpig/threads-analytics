// Update-check payload shared by the web (Docker image) and desktop (GitHub
// Release) targets. Client components only depend on this shape, so the
// target-specific lookups stay server-only.

export interface VersionLink {
  label: string;
  url: string;
}

export interface UpdateStatusPayload {
  // Whether this build can check for updates at all (published image or
  // packaged desktop release).
  supported: boolean;
  // True only when the comparison actually ran. A failed check reports
  // checked: false so consumers say "couldn't check" rather than a false
  // "you're up to date".
  checked: boolean;
  updateAvailable: boolean;
  // The running version, when identifiable.
  current: VersionLink | null;
  // The newer version's page, when one is available and has a page to link.
  latest: VersionLink | null;
  // Direct download of the newer version's build, when the target ships one
  // (the desktop release ZIP). It opens in the system browser, so macOS
  // quarantines the file and Gatekeeper still checks the app on first launch.
  download: string | null;
  // Identifies the available update (image digest or release tag) so a
  // dismissed banner stays dismissed until a different update appears.
  updateId: string | null;
}
