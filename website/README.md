# Threads Analytics Website

The independent marketing website for [Threads Analytics](https://github.com/ridemountainpig/threads-analytics).

## Development

The website is a separate pnpm project from the dashboard at the repository root, with its own
lockfile. Run its commands from this `website/` directory:

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

## Content

Long-form article bodies are MDX in `content/`, one file per locale:

- `content/guides/<slug>/<locale>.mdx`: the guides. Each guide's title, FAQ and CTA copy stay in
  `lib/guides/<slug>.ts`.
- `content/self-host/<locale>.mdx`: the self-host guide at `/deploy/self-host`. Its title and CTA
  copy are in `lib/self-host.ts`.

Write plain Markdown, including GitHub-style tables. Links that start with `/` are site paths
without the locale (`/guides/reach-drop`, `/#deploy`) and resolve to the reader's locale. These
components are available without importing them:

- `<Callout>…</Callout>`: a highlighted note. Keep it on one line.
- `<Table caption="…">` around a Markdown table, with blank lines inside the tags. Add
  `variant="text"` for tables of prose rather than figures.
- `<Figure image="performance" alt="…" caption="…" />`: a dashboard screenshot from
  `lib/guides/index.ts`.

Every `##` and `###` heading gets an id. The `##` headings also feed the outlines on `/guides` and
the self-host guide's section list. `**bold**` right after Chinese or Japanese punctuation
(`**重點。**接著`) works as written.

Prettier skips `content/` (see the repository's `.prettierignore`): it formats MDX components as
JSX, rewrapping the text inside them, and a line break inside a Chinese or Japanese sentence
renders as a space.

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
