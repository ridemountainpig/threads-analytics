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

`pnpm desktop:package:macos` embeds the Node executable used by the build, so the resulting `.app` does not require a global Node installation. After Native SDK bundles the web runtime, the script restores required symlinks, stages Node outside the asset manifest, and ad-hoc signs the native addons, Node, shell executable, and final app bundle.

Packaging first verifies that the active Node version matches `.nvmrc` and that `better-sqlite3` loads with the same Node ABI. Both `pnpm desktop:package:macos` and `zig build package` use this one packaging implementation.

Build each release on its target architecture.

## Releases

Desktop releases are published manually from the **Release Desktop (macOS)** GitHub Actions workflow (`.github/workflows/release-desktop.yml`). Run it from the branch or commit to release and enter a version such as `0.1.0-beta.1`.

The Native SDK manifest only accepts a plain `X.Y.Z` version, so pre-release suffixes live in the tag and asset name only. The workflow checks that the `X.Y.Z` prefix matches both `desktop/app.json` and `package.json`, builds the app on an Apple silicon runner, zips it as `Threads-Analytics-<version>-macos-arm64.zip` with a SHA-256 file, and creates the `v<version>` tag and GitHub Release. Versions with a suffix are always published as pre-releases; plain versions follow the workflow's pre-release input.

Releases are ad-hoc signed and not notarized, so the generated release notes say so and link to the install guide.

The workflow also passes the full release version to the build as `THREADS_ANALYTICS_DESKTOP_VERSION`. `desktop/scripts/build-next.mjs` bakes it into the app as `NEXT_PUBLIC_DESKTOP_APP_VERSION` (local packages fall back to the manifest version), and the running app compares that against the newest GitHub Release that ships a `-macos-arm64.zip` asset. A formal build is only offered formal releases: a plain `X.Y.Z` version that is not marked pre-release. A beta build (e.g. `0.1.0-beta.1`) is offered a newer formal release first, which brings it back to the formal line even if a beta for the next line is already out, and otherwise newer versions with a pre-release suffix. If the first page of releases has nothing on the build's line, Settings → About says it couldn't check rather than claiming the app is up to date. A plain version that is still marked pre-release is offered to no one. Because the workflow marks plain versions as pre-releases by default, a formal release reaches installed apps only once it is published, or later edited, with that box unchecked. A newer version shows a dashboard banner and is reported under Settings → About; both link straight to that release's ZIP. The download opens in the system browser rather than the app, so macOS quarantines it and Gatekeeper checks the new app on first launch as usual. The link is only offered for URLs under this repository's release downloads, which the `external_links` allowlist in `desktop/app.json` covers. Development builds have no baked version and skip the check.

The desktop Next build sets `experimental.isrFlushToDisk: false` so the fetch/ISR cache stays in memory. Otherwise the standalone server would write `.next/cache` inside the signed `.app` bundle on first use and invalidate its code signature.

## Native SDK commands

Run these from the repository root:

```bash
pnpm exec native doctor --manifest desktop/app.json # Check the host, WebView, and manifest configuration
pnpm exec native validate desktop/app.json          # Validate app.json against the manifest schema
pnpm exec native dev desktop --yes                  # Build and run the Debug app with the frontend development server
pnpm exec native build desktop --yes                # Build the ReleaseFast binary in desktop/zig-out/bin
```
