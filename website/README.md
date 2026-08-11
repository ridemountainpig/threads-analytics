# Threads Analytics Website

The independent marketing website for [Threads Analytics](https://github.com/ridemountainpig/threads-analytics).

## Development

```bash
pnpm install
pnpm dev
```

The website runs at [http://localhost:3001](http://localhost:3001). The root URL redirects from the browser language to one of:

- `/en`
- `/zh-TW`
- `/ja`

## Environment

Copy `.env.example` to `.env.local` and replace the placeholder with the canonical production
origin before deployment:

```bash
SITE_URL=https://analytics.example.com
```

This value is used for canonical metadata, Open Graph URLs, `robots.txt`, and `sitemap.xml`.
Production builds fail when it is missing, non-HTTPS, localhost, or an `example.com` placeholder.
`NEXT_PUBLIC_SITE_URL` remains supported for existing deployments, but `SITE_URL` is preferred
because the value is only consumed on the server.

## Open Graph images

The per-locale Open Graph images in `public/og/` are pre-rendered rather than generated at
request time, because `next/og` rasterizes through the host's `sharp` build and some hosting
providers ship one without SVG support. After changing the hero copy or the design in
`scripts/og/generate-og-images.tsx`, regenerate them and commit the result:

```bash
pnpm og:generate
```

Generation needs network access — satori downloads CJK font subsets for `zh-TW` and `ja`.

## Commands

```bash
pnpm dev
pnpm lint
pnpm build
pnpm start
pnpm og:generate
```

This project is deployed independently from the dashboard Docker image. The repository root `.dockerignore` excludes the entire `website` directory.
