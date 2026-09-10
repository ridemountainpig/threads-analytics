<p align="center">
  <img src="public/threads-analytics-icon.png" alt="Threads Analytics icon" width="92" />
</p>
<h1 align="center">Threads Analytics</h1>
<p align="center">
  A self-hosted Threads analytics dashboard. Connect your access token and explore post performance with detailed charts and metrics.
</p>
<p align="center">
  <a href="./README-zh.md">繁體中文</a> · <a href="./README.md">English</a> · <a href="./README-ja.md">日本語</a>
</p>

<p align="center">
  <img src="public/dashboard.png" alt="Threads Analytics dashboard" />
</p>

---

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Requirements](#requirements)
- [Development](#development)
- [Getting Your Threads Access Token](#getting-your-threads-access-token)
- [Analytics Reference](#analytics-reference)
- [MCP Server](#mcp-server)
- [Deployment](#deployment)
  - [Updating an existing deployment](#updating-an-existing-deployment)

---

## Quick Start

```bash
git clone https://github.com/ridemountainpig/threads-analytics.git
cd threads-analytics
pnpm install
cp .env.example .env.local # or create .env.local manually
npx prisma migrate dev --name init
npx prisma generate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with `APP_PASSWORD`.

---

## Features

- **Overview** — stat cards (views, likes, replies, reposts, quotes, shares, engagement rate) with period-over-period delta, views trend chart (day / week / month), best posting hour recommendation, viral posts
- **Analytics** — 25+ charts across **Performance**, **Content**, and **Audience** tabs
- **Posts** — searchable, filterable list with per-post analytics panel
- **MCP server** — let Claude and other AI agents query your analytics through an OAuth-protected endpoint
- Multi-account support with account switching
- Auto-sync on configurable intervals
- Password-protected (single `APP_PASSWORD` env var)
- English / 繁體中文 / 日本語 UI

---

## Requirements

- Node.js 20.9+
- pnpm
- PostgreSQL database

---

## Development

### 1. Clone and install

```bash
git clone https://github.com/ridemountainpig/threads-analytics.git
cd threads-analytics
pnpm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```env
APP_PASSWORD=your_dashboard_password
DATABASE_URL=postgresql://...              # PostgreSQL connection string
TOKEN_ENCRYPTION_KEY=                      # openssl rand -hex 32
CRON_SECRET=                               # optional, secures /api/cron/sync in production
SYNC_SCHEDULER_ENABLED=false              # set true only on long-running deployments
```

| Variable                 | Description                                   | How to generate        |
| ------------------------ | --------------------------------------------- | ---------------------- |
| `APP_PASSWORD`           | Password to access the dashboard              | Choose any string      |
| `DATABASE_URL`           | PostgreSQL connection string                  | From your DB provider  |
| `TOKEN_ENCRYPTION_KEY`   | Encrypts stored Threads access tokens at rest | `openssl rand -hex 32` |
| `CRON_SECRET`            | Secures `/api/cron/sync` in production        | Random 16+ chars       |
| `SYNC_SCHEDULER_ENABLED` | Enables the built-in polling scheduler        | `true` for Docker/VPS  |

### 3. Run database migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
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
npx prisma generate # Regenerate the Prisma Client
```

## Getting Your Threads Access Token

1. Go to [developers.facebook.com](https://developers.facebook.com) and create an app with the **Access the Threads API** use case
2. Generate an **Access Token**
3. In the dashboard: **Settings → Add Threads Account → paste token**

For a screenshot-based walkthrough, see [How to Generate a Threads Access Token](./public/token-generate-step/README.md).

> Tokens are valid for 60 days, and the app renews them for you: during each sync it checks the token and automatically extends it for another 60 days once fewer than 30 days remain (the Threads API only renews tokens older than 24 hours). The account card in Settings shows the token's expiry date and the last automatic renewal. If a token still expires — e.g. the app was offline too long for a sync to renew it — the dashboard shows an expiry warning; generate a new token and paste it with the **Update token** button on the account card — your synced data is kept.

---

## Analytics Reference

> The time-series charts (Views Trend, Overall Performance, Engagement Rate Trend, Engagement Breakdown, Shares Over Time, Reach Growth Trend) each switch between **day / week / month** granularity, and each remembers its own choice.

### Overview

| Section         | What it shows                                                                                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stat Cards**  | Total views, likes, replies, reposts, quotes, shares, and engagement rate for the selected period. Each card shows a `+/−%` delta vs the previous period of the same length. |
| **Best Hours**  | Top 2–3 posting hours ranked by median views, with a confidence indicator based on sample size.                                                                              |
| **Views Trend** | Views by day, week, or month, with your personal median as a baseline.                                                                                                       |
| **Top Posts**   | Posts that exceeded the median view count, ranked by their multiplier (e.g. `3.2× median`).                                                                                  |

### Analytics — Performance tab

Stats at the top of the tab: **Total Views**, **Avg Views / Day**, **Eng. Rate**, **Share Rate**.

| Chart                         | What it shows                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Overall Performance**       | Combined daily views, post count, and average views per post on one timeline.                                                                           |
| **Post Quality Map**          | Scatter plot of every post by reach (views) vs. engagement rate. Dot size = shares. Four quadrants: Breakout, Conversation, Broadcast, Underperforming. |
| **Views to Actions Funnel**   | Conversion rate from total views into each action type (likes, replies, reposts, quotes, shares).                                                       |
| **Best Time to Post**         | Heatmap of median views by hour of day. Tooltip shows sample count and confidence level.                                                                |
| **Engagement Rate Trend**     | Daily engagement rate (interactions ÷ views) with a 7-day smoothed average.                                                                             |
| **Best Day of Week**          | Median views, engagement rate, and post count by weekday.                                                                                               |
| **Format × Length Matrix**    | 2-D heatmap comparing every combination of content format and post length against your median reach.                                                    |
| **Engagement Type Breakdown** | Pie chart of the proportion of likes, replies, reposts, quotes, and shares.                                                                             |
| **Engagement Breakdown**      | Stacked chart of likes, replies, reposts, and quotes over time.                                                                                         |
| **Reach Growth Trend**        | Median and average views per post over time — is the account's reach growing?                                                                           |
| **Views Distribution**        | How posts spread across view ranges, with hit rates for each milestone (1k, 5k, 10k…).                                                                  |

### Analytics — Content tab

Stat metrics at the top of the tab: **Posting Consistency** (% of weeks with at least one post), **Share Rate**, **Quote Ratio** (quotes ÷ (quotes + reposts)), **Total Posts**, **Longest Streak**, and **Current Streak**.

| Chart                                   | What it shows                                                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Posting Activity**                    | Calendar heatmap showing how many posts you published each day.                                                                  |
| **Content Type Performance**            | Median views, engagement rate, and share rate by media type (Text, Image, Video, Carousel, Audio). Low-sample buckets are faded. |
| **Post Length Analysis**                | Median views broken down by character-count bucket. Tooltip includes average, P75, hit rate, and confidence.                     |
| **Publishing Frequency vs Performance** | Whether posting more in a given week raises or lowers per-post average views.                                                    |
| **Shares Trend**                        | Daily share counts over time.                                                                                                    |
| **Top Keywords by Engagement**          | Words (excluding hashtags) with the highest average engagement rate (minimum 3 posts).                                           |
| **Optimal Posting Frequency**           | Per-post reach and engagement compared across different weekly posting volumes.                                                  |
| **Content Type by Time Slot**           | Best posting hour for each content format based on median views.                                                                 |
| **Top by Engagement Rate**              | Highest-engagement posts ranked by (likes + replies + reposts + quotes) ÷ views.                                                 |
| **Reply-Rate Leaders**                  | Posts ranked by replies ÷ views — your best conversation starters.                                                               |
| **Share-Rate Leaders**                  | Posts ranked by shares ÷ views — your most save-worthy content.                                                                  |
| **Posting Gap vs Performance**          | Median views by days since your previous post — does posting daily beat taking a break?                                          |
| **Content Feature Comparison**          | Posts with and without links, and with and without questions, compared side by side.                                             |

### Analytics — Audience tab

Stats at the top of the tab: **Followers**, **Net Growth** (with `+/−%`), **Avg / Day**, **Days Tracked**.

| Chart                     | What it shows                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Follower Growth**       | Follower count over time, one point per synced day; the tooltip carries that day's change.                                                                                  |
| **Follower Demographics** | One distribution per breakdown — country, city, age, gender — with a marker on each bar for the baseline date and both a head-count and a percentage-point delta.           |
| **Composition Trend**     | Each group's share as a change in percentage points from the baseline date, top 5 movers per breakdown. Composition shifts too slowly for absolute shares to show anything. |

> Threads only reports `followers_count` and `follower_demographics` as of right now — both reject `since` / `until` — so history can't be backfilled and builds up one row per day. Audience metrics are captured **at most once per calendar day**, however often posts are synced, so a frequent post schedule costs no extra API quota here. Demographics additionally require the profile to have at least 100 followers. Pick the two dates to compare with the date selectors; only days that were actually captured are offered.

### Posts page

The posts list supports:

- **Sort** by date, views, or likes
- **Search** full-text across post content
- **Filter** by media type (shows only types present in the current period)

Clicking any post opens a detail panel with views, engagement rate, vs-median multiplier, view percentile, and a per-action engagement breakdown.

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

Connected clients appear in **Settings → Connected Agents**, where each one can be revoked at any time.

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

### One-click deploy

The fastest way to get a hosted instance — both templates provision a PostgreSQL database and set the required environment variables for you:

| Platform | Deploy                                                                                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Railway  | [![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/zibjsX?referralCode=vPBCb4&utm_medium=integration&utm_source=template&utm_campaign=generic) |
| Zeabur   | [![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/XLGQAD)                                                                                     |

### Auto-sync behavior

#### Railway / Zeabur / VPS / Docker

Set `SYNC_SCHEDULER_ENABLED=true` in your environment variables. The built-in scheduler starts with the server and syncs at the interval configured in Settings.

#### Vercel

Vercel does not support long-running processes. Use [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) to call `/api/cron/sync` on a schedule instead.

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

### Docker

A prebuilt multi-arch (amd64/arm64) image is published to GitHub Container Registry. Set all environment variables, then run:

```bash
docker run -p 3000:3000 --env-file .env.local ghcr.io/ridemountainpig/threads-analytics:latest
```

Or build the image from source yourself:

```bash
docker build -t threads-analytics .
docker run -p 3000:3000 --env-file .env.local threads-analytics
```

The Docker image runs `prisma migrate deploy` automatically on startup.

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
- **Vercel** — push the new version. Vercel never runs `pnpm start`, so migrations run at build time through the `vercel-build` script (`prisma migrate deploy && next build`), which Vercel prefers over `build` when present.

Your database (posts, insights, accounts) is preserved across updates.
