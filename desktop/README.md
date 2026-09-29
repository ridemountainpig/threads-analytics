# Threads Analytics Desktop

[繁體中文](./README-zh.md) | English | [日本語](./README-ja.md)

[Back to the project README](../README.md)

Threads Analytics Desktop packages the existing web dashboard as a macOS app. Your Threads data is stored locally on your Mac in SQLite, while the hosted web version continues to use PostgreSQL.

## Download and install

The desktop app supports macOS 11 or later on Macs with Apple silicon (M1 or later).

- [Download the newest GitHub Release](https://github.com/ridemountainpig/threads-analytics/releases)
- [Read the macOS installation, update, and uninstall guide](./docs/install-macos.md)

## Differences from the web version

- **Local database** — data is stored in SQLite on your Mac; no PostgreSQL or server setup is needed.
- **No password** — there is no `APP_PASSWORD` sign-in and no sign-out action.
- **Built-in auto-sync** — the sync scheduler is always enabled; `SYNC_SCHEDULER_ENABLED` does not need to be set.
- **Manual updates** — the app shows a notice when a new release is available, but you download and install it yourself.

## Development

Requirements:

- A Mac with Apple silicon
- Node.js 24.21.0 (pinned in `.nvmrc`; the desktop build embeds this exact runtime, unlike the web version's Node.js 20.9+)
- pnpm
- [Zig](https://ziglang.org/download/) 0.16.0 or later, available on `PATH`
- Xcode Command Line Tools (`xcode-select --install`), for `codesign` during packaging

### Quick start

Run these commands from the repository root:

```bash
nvm use                                             # Use the Node.js version pinned by .nvmrc
pnpm install                                        # Install project dependencies
pnpm exec native doctor --manifest desktop/app.json # Check the desktop development environment
pnpm exec native dev desktop --yes                  # Build and run the app in development mode
```

### Common commands

```bash
pnpm desktop:typecheck      # Type-check the desktop-specific adapters
pnpm desktop:test           # Run the desktop test suite
pnpm desktop:dev:web        # Start the desktop Next.js development server
pnpm desktop:build:web      # Build and stage the Next.js runtime in desktop/dist
pnpm desktop:package:check  # Verify the pinned Node runtime and native SQLite ABI
pnpm desktop:package:macos  # Build and package an ad-hoc-signed macOS app bundle
pnpm desktop:open:macos     # Open the packaged app
```

The packaged app is written to `desktop/zig-out/package/Threads-Analytics.app`.

### Data locations

| Environment  | Database                                                               | Token encryption key                                                    |
| ------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Development  | `desktop/runtime/dev.db`                                               | `desktop/runtime/.dev-token-encryption-key`                             |
| Packaged app | `~/Library/Application Support/Threads Analytics/threads-analytics.db` | `~/Library/Application Support/Threads Analytics/.token-encryption-key` |

The database and its key belong together: deleting the key makes the stored access tokens unreadable.

### Zig build steps

The native shell also exposes Zig build steps. Run these from `desktop/`:

```bash
zig build dev     # Run the frontend development server and native shell
zig build run     # Build the staged frontend and run the native app
zig build test    # Run the Zig test suite
zig build package # Run the same macOS packaging pipeline as pnpm desktop:package:macos
```

Architecture, runtime, security, packaging, and release details are documented in [Desktop technical notes](./docs/technical-notes.md).
