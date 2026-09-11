<p align="center">
  <img src="public/threads-analytics-icon.png" alt="Threads Analytics icon" width="92" />
</p>
<h1 align="center">Threads Analytics</h1>
<p align="center">
  A self-hosted Threads analytics dashboard. Connect your access token and explore post performance with detailed charts and metrics.
</p>
<p align="center">
  <a href="https://github.com/ridemountainpig/threads-analytics/stargazers"><img src="https://shieldcn.dev/github/stars/ridemountainpig/threads-analytics.svg?variant=secondary" alt="GitHub stars" /></a>
  <a href="./LICENSE"><img src="https://shieldcn.dev/github/license/ridemountainpig/threads-analytics.svg?variant=secondary" alt="License: AGPL-3.0" /></a>
  <a href="https://github.com/ridemountainpig/threads-analytics/pkgs/container/threads-analytics"><img src="https://shieldcn.dev/badge/docker-ghcr.io.svg?variant=secondary&logo=docker" alt="Docker image on GHCR" /></a>
</p>
<p align="center">
  <a href="./README-zh.md">繁體中文</a> · <a href="./README.md">English</a> · <a href="./README-ja.md">日本語</a>
</p>

<p align="center">
  <img src="public/dashboard.png" alt="Threads Analytics dashboard" />
</p>

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Getting Your Threads Access Token](#getting-your-threads-access-token)
- [MCP Server](#mcp-server)
- [Deployment](#deployment)
  - [Docker](#docker)
  - [Vercel](#vercel)
  - [Auto-sync](#auto-sync)
  - [Updating an existing deployment](#updating-an-existing-deployment)
- [Development](#development)
- [Analytics Reference](#analytics-reference)
- [License](#license)

---

## Features

- **Overview** — stat cards (views, likes, replies, reposts, quotes, shares, engagement rate) with period-over-period delta, views trend chart (day / week / month), best posting hour recommendation, viral posts
- **Analytics** — 25+ charts across **Performance**, **Content**, and **Audience** tabs
- **Posts** — searchable, filterable list with per-post analytics panel
- **MCP server** — let Claude and other AI agents query your analytics through an OAuth-protected endpoint
- Multi-account support with account switching
- Auto-sync on configurable intervals
- Automatic access-token renewal — connect once, no manual re-pasting every 60 days
- Password-protected (single `APP_PASSWORD` env var)
- English / 繁體中文 / 日本語 UI

---

## Quick Start

The fastest way to a running instance is a one-click deploy — both templates provision a PostgreSQL database and set the required environment variables for you:

| Platform | Deploy                                                                                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Railway  | [![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/zibjsX?referralCode=vPBCb4&utm_medium=integration&utm_source=template&utm_campaign=generic) |
| Zeabur   | [![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/XLGQAD)                                                                                     |

Prefer to let an AI coding agent (Claude Code, Codex, Cursor…) handle it? Each agent deploy guide comes with a ready-made prompt — paste it into your agent and it provisions the database, deploys the app, and hands back the URL: [Railway](https://threads-analytics.app/en/deploy/railway-agent) · [Zeabur](https://threads-analytics.app/en/deploy/zeabur-agent) · [Vercel](https://threads-analytics.app/en/deploy/vercel-agent)

Already have a server? Run the prebuilt image directly (see [Docker](#docker)):

```bash
docker run -p 3000:3000 --env-file .env.local ghcr.io/ridemountainpig/threads-analytics:latest
```

Once the app is up, sign in with your `APP_PASSWORD` and connect a Threads account — see the next section. To run from source instead, see [Development](#development).

---

## Getting Your Threads Access Token

1. Go to [developers.facebook.com](https://developers.facebook.com) and create an app with the **Access the Threads API** use case
2. Generate an **Access Token**
3. In the dashboard: **Settings → Add Threads Account → paste token**

For a screenshot-based walkthrough, see [How to Generate a Threads Access Token](./public/token-generate-step/README.md).

Tokens are valid for 60 days, and the app renews them for you:

- During each sync, the app checks the token and automatically extends it for another 60 days once fewer than 30 days remain (the Threads API only renews tokens older than 24 hours).
- The account card in Settings shows the token's expiry date and the last automatic renewal.
- If a token still expires — e.g. the app was offline too long for a sync to renew it — the dashboard shows an expiry warning. Generate a new token and paste it with the **Update token** button on the account card; your synced data is kept.

---

## MCP Server

The dashboard ships a remote [MCP](https://modelcontextprotocol.io) server at `/api/mcp` (Streamable HTTP), so AI agents like Claude can query your synced Threads data — posts, aggregated analytics, and follower history — and answer questions or write reports about your account. Everything is **read-only**.

### Connecting an agent

Authentication uses OAuth 2.1 with PKCE and Dynamic Client Registration — there is no API key to copy. On first connection the client registers itself, your browser opens the dashboard login (`APP_PASSWORD`), and you approve access on a consent screen.

**Claude Code**

```bash
claude mcp add --transport http threads-analytics https://your-deployment.example.com/api/mcp
```

Then run `/mcp` inside Claude Code to complete the OAuth sign-in.

**Claude (web / desktop)** — Settings → Connectors → **Add custom connector**, and paste `https://your-deployment.example.com/api/mcp`.

Connected clients appear in **Settings → Connected agents**, where each one can be revoked at any time.

### Tools

| Tool                   | What it does                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `get_account_overview` | Username, sync status, post count, data date range, and follower growth summary — the recommended first call                                                       |
| `list_posts`           | Posts with metrics; supports date range, sorting (date / views / likes / engagement rate), media-type filter, full-text search, and pagination                     |
| `get_post`             | Full detail of a single post, including its complete text                                                                                                          |
| `get_analytics`        | 31 aggregated analytics sections over a date range (best time to post, keyword analysis, views distribution, posting streaks, …) — pick only the sections you need |
| `get_follower_history` | Daily follower-count snapshots with growth summary, and optionally the latest audience demographics                                                                |
| `compare_periods`      | Core metrics for two periods with absolute and percentage changes; the comparison period defaults to the same-length window immediately before                     |

### Prompts

The server also registers ready-made prompts, each taking an optional `period` argument (e.g. `30d`, `90d`, or a date range):

| Prompt                 | What it produces                                                             |
| ---------------------- | ---------------------------------------------------------------------------- |
| `performance-review`   | A full performance report: trends, best/worst posts, and actions to improve  |
| `content-strategy`     | Which formats, lengths, and topics work, with a recommended content mix      |
| `posting-schedule`     | A concrete weekly posting schedule based on when your audience engages       |
| `viral-post-breakdown` | Deep-dive of outlier posts and the repeatable patterns behind them           |
| `audience-insights`    | Follower growth and demographics, and what they imply for content and timing |
| `topic-analysis`       | Which topics and writing patterns drive performance, plus new post ideas     |

---

## Deployment

### Docker

A prebuilt multi-arch (amd64/arm64) image is published to GitHub Container Registry. Set the [environment variables](#2-set-up-environment-variables), then run:

```bash
docker run -p 3000:3000 --env-file .env.local ghcr.io/ridemountainpig/threads-analytics:latest
```

Or build the image from source yourself:

```bash
docker build -t threads-analytics .
docker run -p 3000:3000 --env-file .env.local threads-analytics
```

The Docker image runs `prisma migrate deploy` automatically on startup.

### Vercel

Import the repository into Vercel and set the [environment variables](#2-set-up-environment-variables). Migrations run at build time through the `vercel-build` script (`prisma migrate deploy && next build`), which Vercel prefers over `build` when present.

Vercel does not support long-running processes, so the built-in sync scheduler cannot run there. Use [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) to call `/api/cron/sync` on a schedule instead:

1. Add a `vercel.json` to the project root:

   ```json
   {
     "crons": [
       {
         "path": "/api/cron/sync",
         "schedule": "0 * * * *"
       }
     ]
   }
   ```

   Adjust `schedule` to match the sync interval you set in Settings (e.g. `0 * * * *` for every hour, `*/30 * * * *` for every 30 minutes). Note that Vercel's free plan limits cron frequency.

2. In the Vercel dashboard go to **Settings → Environment Variables** and add:

   | Variable      | Value                                                  |
   | ------------- | ------------------------------------------------------ |
   | `CRON_SECRET` | A random secret — generate with `openssl rand -hex 32` |

   Vercel automatically injects this value as `Authorization: Bearer <CRON_SECRET>` on every cron request, and the `/api/cron/sync` route uses it to verify the call is legitimate.

### Auto-sync

On long-running deployments (Railway / Zeabur / VPS / Docker), set `SYNC_SCHEDULER_ENABLED=true`. The built-in scheduler starts with the server and syncs at the interval configured in Settings. On Vercel, use the cron setup above instead.

<a id="updating"></a>

### Updating an existing deployment

New versions ship as updated Docker images. Database migrations run automatically on startup, so updating only requires getting the new image or code:

- **Docker / VPS** — pull the latest image, then stop the old container and start a new one with the same flags:

  ```bash
  docker pull ghcr.io/ridemountainpig/threads-analytics:latest
  ```

- **Zeabur** — open the `threads-analytics` service and click **Redeploy** to pull the latest image.
- **Railway** — trigger a redeploy of the service from the Railway dashboard.
- **From source** — `git pull`, then `pnpm install && pnpm build` and restart with `pnpm start` (runs migrations automatically).
- **Vercel** — push the new version; migrations run at build time as described above.

Your database (posts, insights, accounts) is preserved across updates.

---

## Development

Requirements: Node.js 20.9+, pnpm, and a PostgreSQL database.

### 1. Clone and install

```bash
git clone https://github.com/ridemountainpig/threads-analytics.git
cd threads-analytics
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Then fill in the values:

| Variable                 | Description                                   | How to generate        |
| ------------------------ | --------------------------------------------- | ---------------------- |
| `APP_PASSWORD`           | Password to access the dashboard              | Choose any string      |
| `DATABASE_URL`           | PostgreSQL connection string                  | From your DB provider  |
| `TOKEN_ENCRYPTION_KEY`   | Encrypts stored Threads access tokens at rest | `openssl rand -hex 32` |
| `CRON_SECRET`            | Secures `/api/cron/sync` in production        | Random 16+ chars       |
| `SYNC_SCHEDULER_ENABLED` | Enables the built-in polling scheduler        | `true` for Docker/VPS  |

### 3. Run database migrations

```bash
npx prisma migrate dev
```

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your `APP_PASSWORD`.

### 5. Connect a Threads account

1. Go to **Settings** in the sidebar
2. Click **Add Threads account**
3. Paste your long-lived Threads access token (see [Getting Your Access Token](#getting-your-threads-access-token))
4. The first sync starts automatically and may take a few minutes

### Useful commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Run migrations and start production server
npx prisma studio # Open database GUI
npx prisma migrate dev --name <name>  # Create a new migration
```

---

## Analytics Reference

The dashboard ships 25+ charts across the Overview, Analytics (Performance / Content / Audience), and Posts pages. What every chart shows — and the sampling rules behind the audience metrics — is documented in the **[Analytics Reference](./docs/analytics.md)**.

---

## License

Threads Analytics is open source under the [GNU Affero General Public License v3.0](./LICENSE). You are free to self-host, modify, and redistribute it — but if you run a modified version as a network service, you must make its source code available under the same license.
