// Generates the static Open Graph images served from public/og/.
//
// The images used to be rendered at request time by an
// app/[locale]/opengraph-image.tsx route, but next/og rasterizes satori's SVG
// through sharp whenever sharp is importable, and some hosting providers ship
// a sharp/libvips build without SVG support ("Input buffer contains
// unsupported image format"). Pre-rendering locally keeps the result
// independent of the deploy host.
//
// Re-run with `pnpm og:generate` whenever the hero copy or the design below
// changes, and commit the updated PNGs. Requires network access: satori
// fetches CJK font subsets for the zh-TW and ja images.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import { Railway, Vercel } from "../../components/deployment-logos";
import { getGuide, guideHub, guideSlugs } from "../../lib/guides";
import { getDictionary, locales, type Locale } from "../../lib/i18n";
import { selfHost } from "../../lib/self-host";

const size = { width: 1200, height: 630 };

const arrowGlyph = (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
);

// Defensively strip U+2060 from pasted copy. Headline wrapping is controlled
// explicitly via \n + pre-line instead of invisible formatting characters.
const stripWordJoiners = (text: string) => text.replace(/\u2060/g, "");

// Headlines are sized for two Latin lines; a CJK line runs about twice as
// wide per glyph, so shrink the font until the longest line fits the box.
const HEADLINE_MAX_WIDTH = 1010;
const HEADLINE_FONT_SIZE = 74;
function headlineFontSize(lines: [string, string]) {
  const widest = Math.max(
    ...lines.map(stripWordJoiners).map((line) =>
      [...line].reduce((units, ch) => {
        if (ch === " " || ch === "\u00a0") return units + 0.28;
        if (/[0-9]/.test(ch)) return units + 0.58;
        if (/[A-Z]/.test(ch)) return units + 0.68;
        if (/[a-z]/.test(ch)) return units + 0.52;
        if (/[\u3000-\u9fff\uf900-\ufaff\uff00-\uffef]/.test(ch)) return units + 0.96;
        return units + 0.5;
      }, 0),
    ),
  );
  return Math.min(HEADLINE_FONT_SIZE, Math.floor(HEADLINE_MAX_WIDTH / widest));
}

// The searchable local name for the product, shown beside the wordmark:
// the descriptor people actually type, so the card reads as one of them.
const brandLabels: Record<Locale, string> = {
  en: "",
  "zh-TW": "Threads 數據分析工具",
  ja: "Threads 分析ツール",
};

// Same palette as the site in light mode (app/styles/tokens.css).
const colors = {
  bg: "#ffffff",
  text: "#0a0a0a",
  textSoft: "#424242",
  muted: "#6b6b6b",
  rule: "#e4e4e4",
} as const;

function renderOpenGraphImage({
  brandIconSrc,
  brandLabel,
  headline,
  description,
  footerLeft,
  footerRight,
}: {
  brandIconSrc: string;
  brandLabel: string;
  headline: [string, string];
  description: string;
  footerLeft: ReactElement | string;
  footerRight: ReactElement | string;
}) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "56px 72px 52px",
        background: colors.bg,
        color: colors.text,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 28,
          borderBottom: `1px solid ${colors.rule}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26 }}>
          {/* Same brand icon the site header uses; the PNG carries its own
              rounded dark background, so no wrapper box. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders raw image elements. */}
          <img alt="" src={brandIconSrc} width={34} height={34} />
          Threads Analytics
          {brandLabel ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                marginLeft: 4,
                padding: "6px 14px",
                border: `1px solid ${colors.rule}`,
                borderRadius: 999,
                color: colors.muted,
                fontSize: 17,
              }}
            >
              {brandLabel}
            </span>
          ) : null}
        </div>
        <div style={{ display: "flex", fontSize: 18, color: colors.muted }}>{footerRight}</div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 56,
          maxWidth: HEADLINE_MAX_WIDTH,
          fontSize: headlineFontSize(headline),
          lineHeight: 1.06,
          letterSpacing: "-0.04em",
        }}
      >
        <span>{stripWordJoiners(headline[0])}</span>
        <span style={{ color: colors.muted }}>{stripWordJoiners(headline[1])}</span>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 28,
          maxWidth: 900,
          fontSize: 24,
          color: colors.textSoft,
          lineHeight: 1.45,
        }}
      >
        {stripWordJoiners(description)}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: "auto",
          paddingTop: 22,
          borderTop: `1px solid ${colors.rule}`,
          fontSize: 18,
          letterSpacing: "0.04em",
          color: colors.muted,
        }}
      >
        {footerLeft}
      </div>
    </div>,
    size,
  );
}

type OgVariant = {
  // `ogImageSet` naming from lib/metadata.ts: written to
  // public/og/<prefix>-<locale>.png; "" means public/og/<locale>.png (home).
  prefix: string;
  render: (locale: Locale, brandIconSrc: string) => ImageResponse;
};

const guideVariants: OgVariant[] = guideSlugs.map((slug) => ({
  prefix: `guide-${slug}`,
  render: (locale, brandIconSrc) => {
    const copy = getGuide(slug, locale);
    return renderOpenGraphImage({
      brandIconSrc,
      brandLabel: brandLabels[locale],
      headline: [copy.hero.lineOne, copy.hero.lineTwo],
      description: copy.metadata.description,
      footerLeft: <span>{copy.hero.kicker}</span>,
      footerRight: (
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: colors.muted }}>
          GUIDE
          {arrowGlyph}
        </span>
      ),
    });
  },
}));

const guideHubVariant: OgVariant = {
  prefix: "guides",
  render: (locale, brandIconSrc) => {
    const copy = guideHub[locale];
    return renderOpenGraphImage({
      brandIconSrc,
      brandLabel: brandLabels[locale],
      headline: [copy.lineOne, copy.lineTwo],
      description: copy.metadata.description,
      footerLeft: <span>{copy.kicker}</span>,
      footerRight: (
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: colors.muted }}>
          GUIDE
          {arrowGlyph}
        </span>
      ),
    });
  },
};

const variants: OgVariant[] = [
  guideHubVariant,
  ...guideVariants,
  {
    prefix: "",
    render: (locale, brandIconSrc) => {
      const copy = getDictionary(locale);
      return renderOpenGraphImage({
        brandIconSrc,
        brandLabel: brandLabels[locale],
        headline: [copy.hero.lineOne, copy.hero.lineTwo],
        description: copy.metadata.description,
        footerLeft: <span>31 ANALYSES · MAC APP OR SELF-HOSTED</span>,
        footerRight: (
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: colors.muted }}>
            OPEN SOURCE
            {arrowGlyph}
          </span>
        ),
      });
    },
  },
  {
    prefix: "railway-agent",
    render: (locale, brandIconSrc) => {
      const copy = getDictionary(locale).railwayAgentDeploy;
      return renderOpenGraphImage({
        brandIconSrc,
        brandLabel: brandLabels[locale],
        headline: [copy.hero.lineOne, copy.hero.lineTwo],
        description: copy.metadata.description,
        footerLeft: <span>{copy.hero.kicker}</span>,
        footerRight: (
          <span style={{ display: "flex", alignItems: "center", gap: 12, color: colors.text }}>
            <Railway width={26} height={26} />
            Railway
          </span>
        ),
      });
    },
  },
  {
    prefix: "token-guide",
    render: (locale, brandIconSrc) => {
      const copy = getDictionary(locale).tokenGuide;
      return renderOpenGraphImage({
        brandIconSrc,
        brandLabel: brandLabels[locale],
        headline: [copy.hero.lineOne, copy.hero.lineTwo],
        description: copy.metadata.description,
        footerLeft: <span>{copy.hero.kicker}</span>,
        footerRight: (
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: colors.muted }}>
            18 STEPS
            {arrowGlyph}
          </span>
        ),
      });
    },
  },
  {
    prefix: "mcp",
    render: (locale, brandIconSrc) => {
      const copy = getDictionary(locale).mcpGuide;
      return renderOpenGraphImage({
        brandIconSrc,
        brandLabel: brandLabels[locale],
        headline: [copy.hero.lineOne, copy.hero.lineTwo],
        description: copy.metadata.description,
        footerLeft: <span>{copy.hero.kicker}</span>,
        footerRight: (
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: colors.muted }}>
            MCP SERVER
            {arrowGlyph}
          </span>
        ),
      });
    },
  },
  {
    prefix: "analytics",
    render: (locale, brandIconSrc) => {
      const copy = getDictionary(locale).analyticsGuide;
      return renderOpenGraphImage({
        brandIconSrc,
        brandLabel: brandLabels[locale],
        headline: [copy.hero.lineOne, copy.hero.lineTwo],
        description: copy.metadata.description,
        footerLeft: <span>{copy.hero.kicker}</span>,
        footerRight: (
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: colors.muted }}>
            31 ANALYSES
            {arrowGlyph}
          </span>
        ),
      });
    },
  },
  {
    prefix: "giveaway",
    render: (locale, brandIconSrc) => {
      const copy = getDictionary(locale).giveawayGuide;
      return renderOpenGraphImage({
        brandIconSrc,
        brandLabel: brandLabels[locale],
        headline: [copy.hero.lineOne, copy.hero.lineTwo],
        description: copy.metadata.description,
        footerLeft: <span>{copy.hero.kicker}</span>,
        footerRight: (
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: colors.muted }}>
            FAIR DRAW
            {arrowGlyph}
          </span>
        ),
      });
    },
  },
  {
    prefix: "desktop",
    render: (locale, brandIconSrc) => {
      const copy = getDictionary(locale).desktopGuide;
      return renderOpenGraphImage({
        brandIconSrc,
        brandLabel: brandLabels[locale],
        headline: [copy.hero.lineOne, copy.hero.lineTwo],
        description: copy.metadata.description,
        footerLeft: <span>{copy.hero.note}</span>,
        footerRight: (
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: colors.muted }}>
            MAC APP
            {arrowGlyph}
          </span>
        ),
      });
    },
  },
  {
    prefix: "vercel-agent",
    render: (locale, brandIconSrc) => {
      const copy = getDictionary(locale).vercelAgentDeploy;
      return renderOpenGraphImage({
        brandIconSrc,
        brandLabel: brandLabels[locale],
        headline: [copy.hero.lineOne, copy.hero.lineTwo],
        description: copy.metadata.description,
        footerLeft: <span>{copy.hero.kicker}</span>,
        footerRight: (
          <span style={{ display: "flex", alignItems: "center", gap: 12, color: colors.text }}>
            <Vercel width={26} height={23} />
            Vercel
          </span>
        ),
      });
    },
  },
  {
    prefix: "self-host",
    render: (locale, brandIconSrc) => {
      const copy = selfHost[locale];
      return renderOpenGraphImage({
        brandIconSrc,
        brandLabel: brandLabels[locale],
        headline: [copy.hero.lineOne, copy.hero.lineTwo],
        description: copy.metadata.description,
        footerLeft: <span>{copy.hero.kicker}</span>,
        footerRight: (
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: colors.muted }}>
            DOCKER
            {arrowGlyph}
          </span>
        ),
      });
    },
  },
];

async function main() {
  // Run via `pnpm og:generate` so cwd is the website root.
  const iconBuffer = await readFile(join(process.cwd(), "public/media/threads-analytics-icon.png"));
  const brandIconSrc = `data:image/png;base64,${iconBuffer.toString("base64")}`;

  const outputDir = join(process.cwd(), "public/og");
  await mkdir(outputDir, { recursive: true });

  for (const variant of variants) {
    for (const locale of locales) {
      const image = variant.render(locale, brandIconSrc);
      const buffer = Buffer.from(await image.arrayBuffer());
      const fileName = variant.prefix ? `${variant.prefix}-${locale}.png` : `${locale}.png`;
      const outputPath = join(outputDir, fileName);
      await writeFile(outputPath, buffer);
      console.log(`wrote ${outputPath} (${buffer.length} bytes)`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
