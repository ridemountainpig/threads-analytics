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

## Commands

```bash
pnpm dev
pnpm lint
pnpm build
pnpm start
```

This project is deployed independently from the dashboard Docker image. The repository root `.dockerignore` excludes the entire `website` directory.
