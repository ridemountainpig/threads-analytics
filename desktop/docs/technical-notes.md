# Desktop Technical Notes

[繁體中文](./technical-notes-zh.md) | English | [日本語](./technical-notes-ja.md)

[Back to the desktop README](../README.md)

## Architecture

The desktop target reuses the repository's Next.js application inside a Native SDK system WebView. A Zig shell starts a local Next.js standalone server on `127.0.0.1:43127`. Desktop data is stored in SQLite through Prisma and `better-sqlite3`; the hosted web target continues to use PostgreSQL.

The desktop target has no login password or sign-out action.

## Repository layout

```text
desktop/
├── app.json
├── build.zig
├── build.zig.zon
├── assets/
├── src/                    # Native SDK lifecycle and WebView shell
├── runtime/                # SQLite adapter, migrations, and server launcher
├── scripts/                # Next.js development, staging, and packaging
└── tests/
```

Generated files under `desktop/dist`, `desktop/zig-out`, and `desktop/runtime/generated` are intentionally ignored. The desktop icon is synchronized from `public/threads-analytics-icon.png` before each desktop web build.

## Runtime and security

The Threads access token is encrypted. Development stores its key under `desktop/runtime`; packaged builds create a mode-`0600` key in the app data directory.

Development uses `desktop/runtime/dev.db`. The packaged launcher defaults to `~/Library/Application Support/Threads Analytics/threads-analytics.db`.

Set `THREADS_ANALYTICS_DATA_DIR` to override the application data directory. Set `THREADS_ANALYTICS_SERVER_DIR`, `THREADS_ANALYTICS_NODE_PATH`, or `THREADS_ANALYTICS_LAUNCHER_PATH` when testing a staged runtime from a custom location.

## Build and packaging

`pnpm desktop:build:web` generates the SQLite Prisma client, builds the root Next.js application with `THREADS_ANALYTICS_TARGET=desktop`, and stages the standalone server, public assets, static files, migrations, and local server launcher under `desktop/dist`.

`pnpm desktop:package:macos` embeds the Node executable used by the build, so the resulting `.app` does not require a global Node installation. After Native SDK bundles the web runtime, the script restores required symlinks, stages Node outside the asset manifest, and signs every Mach-O file in the bundle (found by header, not extension), Node, and the final app bundle. With `MACOS_SIGNING_IDENTITY` set to a Developer ID Application identity, it signs with the hardened runtime and a secure timestamp for notarization, and gives Node the `allow-jit` entitlement in `desktop/assets/node.entitlements`, without which V8 aborts at startup under the hardened runtime. Without it, the bundle is ad-hoc signed, which is what local and CI test builds use.

Packaging first verifies that the active Node version matches `.nvmrc` and that `better-sqlite3` loads with the same Node ABI. Both `pnpm desktop:package:macos` and `zig build package` use this one packaging implementation.

Build each release on its target architecture.

## Releases

Releases are published manually from the **Release** GitHub Actions workflow (`.github/workflows/release.yml`), which ships the Mac app and the dashboard's Docker image as one version built from one commit. Run it from `main` and enter a plain version such as `1.0.0`.

Every release uses a plain `X.Y.Z` version, because the Native SDK updater compares bundle versions and a bundle cannot carry a pre-release suffix. The workflow checks that the version matches both `desktop/app.json` and `package.json`, builds the app on an Apple silicon runner, zips it as `Threads-Analytics-<version>-macos-arm64.zip` with a SHA-256 file, and creates the `v<version>` tag and GitHub Release. Every release is created as a pre-release, which installed apps and the website's download page skip until it is promoted.

The version bump also adds a `## X.Y.Z` section to `CHANGELOG.md`, written for users rather than as a list of PR titles. The release notes lead with that section (read by `desktop/scripts/changelog-section.mjs`), followed by the Mac app's install guides, the `docker pull` command for the image, and a collapsed table of assets and checksums. The workflow fails before the build when the section is missing or empty, and `pnpm desktop:test` checks that the current `package.json` version has one. The `update_notes` input only fills the app's update dialog.

While the app builds, the workflow also builds and smoke-tests the Docker image by calling `.github/workflows/docker-publish.yml`, the workflow that publishes `main` as `latest` between releases. The release image bakes in the version, so the dashboard shows it instead of `sha-…`, and is pushed only as `sha-<short sha>`. Once the app and the image have both passed, the workflow tags that exact image `X.Y.Z` and creates the release; it checked at the start that neither the tag nor the image version exists, and a published `X.Y.Z` is never moved. Test the pre-release with the ZIP and `ghcr.io/ridemountainpig/threads-analytics:X.Y.Z`, then run **Promote Release** (`.github/workflows/promote.yml`) with the version. It points `latest`, `X.Y` and `X` (no `0` for 0.x) at the same image without rebuilding it and publishes the release as Latest. It refuses a version older than the newest published release, so `latest` never moves back.

The workflow imports the Developer ID certificate from the `desktop-release` environment's secrets into a temporary keychain, packages the app with that identity, smoke-tests both the sidecar and the signed shell (`pnpm desktop:smoke:macos --shell`), submits it to Apple's notary service with an App Store Connect API key, and staples the ticket before zipping. The verify step checks the stapled ticket and the Gatekeeper assessment of the extracted app, and that the ZIP holds only the app, with the manifest's bundle id, the release version, and an arm64 executable. The required secrets are listed at the top of the workflow; keep them in the `desktop-release` environment with its deployment branches limited to `main`, so workflows on other branches cannot read them.

The workflow also passes the release version to the build as `THREADS_ANALYTICS_DESKTOP_VERSION`. `desktop/scripts/build-next.mjs` bakes it into the app as `NEXT_PUBLIC_DESKTOP_APP_VERSION` (local packages fall back to the manifest version), and the running app compares that against the newest GitHub Release that ships a `-macos-arm64.zip` asset. A formal build is only offered formal releases: a plain `X.Y.Z` version that is not marked pre-release. Builds of the earlier `0.1.0-beta.N` releases are offered a newer formal release first, and otherwise newer versions with a pre-release suffix. If the first page of releases has nothing on the build's line, Settings → About says it couldn't check rather than claiming the app is up to date. Because every release starts as a pre-release, it reaches installed apps only once Promote Release publishes it. A newer version shows a dashboard banner and is reported under Settings → About. Development builds have no baked version and skip the check.

### In-app updates

The Native SDK updater (`updates` in `desktop/app.json`) installs updates. The workflow's `publish` job signs `native-update.json` with `desktop/scripts/sign-update-feed.mjs`: an Ed25519-signed payload that names the bundle id, version, target, and the ZIP's URL, size, and SHA-256. That job runs on a fresh runner that installs no dependencies and runs none of the app's code, so the `NATIVE_UPDATE_PRIVATE_KEY` secret never shares a machine with that code, and only that job gets a token that can create releases. A Zig test in `desktop/src/main.zig` checks that the verifier compiled into the app accepts the script's output.

Installed apps read the feed from the release GitHub marks as **Latest** (`updates.feed_url`), which Promote Release sets on the version it publishes. The dashboard banner and Settings → About offer **Install**, which runs the `app.check-for-updates` command through the bridge (`native-sdk.command.invoke`, allowed only for the app's own origin); the app menu's **Check for Updates…** runs the same flow. The updater verifies the feed's signature, downloads the ZIP, checks its size and SHA-256, requires exactly one app with the same bundle id and the feed's version, and checks that its code signature carries the installed app's Developer ID team. It then replaces the app and relaunches it, and restores the old copy if the new one fails to open. The app's folder must be writable. `check_on_start` is off, so the updater never interrupts a launch; the banner announces updates instead.

When the bridge call fails, the button falls back to downloading the ZIP. The download opens in the system browser rather than the app, so macOS quarantines it and Gatekeeper checks the new app on first launch as usual. The link is only offered for URLs under this repository's release downloads, which the `external_links` allowlist in `desktop/app.json` covers.

Create the update key once with `pnpm exec native update keygen --private-key <path outside the repository>`. It prints the public key for `updates.public_key`. Store the output of `base64 -i <path>` as the `NATIVE_UPDATE_PRIVATE_KEY` secret in the `desktop-release` environment, and keep an offline backup of the key file: installed apps only accept feeds signed with it, so losing it leaves them on manual updates.

The desktop Next build sets `experimental.isrFlushToDisk: false` so the fetch/ISR cache stays in memory. Otherwise the standalone server would write `.next/cache` inside the signed `.app` bundle on first use and invalidate its code signature.

## Native SDK commands

Run these from the repository root:

```bash
pnpm exec native doctor --manifest desktop/app.json # Check the host, WebView, and manifest configuration
pnpm exec native validate desktop/app.json          # Validate app.json against the manifest schema
pnpm exec native dev desktop --yes                  # Build and run the Debug app with the frontend development server
pnpm exec native build desktop --yes                # Build the ReleaseFast binary in desktop/zig-out/bin
```
