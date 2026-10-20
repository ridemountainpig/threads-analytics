<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository layout

- The repository root is the dashboard. Every self-hosted deployment (Docker, Docker Compose, Vercel, Railway, from source) builds the root, so the app stays there.
- `desktop/` is not a separate package. It builds the same root app with `THREADS_ANALYTICS_TARGET=desktop` (`.desktop.ts` / `.web.ts` module suffixes) inside a Native SDK shell, and its scripts live in the root `package.json` (`pnpm desktop:*`).
- `website/` is the independent marketing site with its own `package.json` and `pnpm-lock.yaml`; run its pnpm commands from inside `website/`. Its `pnpm-workspace.yaml` stops pnpm from resolving to the root workspace, so do not delete it.
