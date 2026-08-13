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
import { Railway, Vercel, Zeabur } from "../../components/deployment-logos";
import { brandCurvePath } from "../../lib/brand-curve";
import { getDictionary, locales, type Locale } from "../../lib/i18n";

const size = { width: 1200, height: 630 };

const openGraphCurve = (
  <svg
    aria-hidden="true"
    width="690"
    height="580"
    viewBox="0 0 760 640"
    style={{ position: "absolute", top: 18, right: -96, opacity: 0.64 }}
  >
    <defs>
      <linearGradient
        id="og-curve-color"
        x1="36"
        y1="513"
        x2="720"
        y2="235"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#ffb18a" />
        <stop offset="0.28" stopColor="#f58bc4" />
        <stop offset="0.66" stopColor="#ce67e5" />
        <stop offset="1" stopColor="#a45ff0" />
      </linearGradient>
      <linearGradient
        id="og-curve-shine"
        x1="36"
        y1="513"
        x2="720"
        y2="235"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#fff4e8" stopOpacity="0.94" />
        <stop offset="0.5" stopColor="#ffe7f5" stopOpacity="0.76" />
        <stop offset="1" stopColor="#f6eaff" stopOpacity="0.58" />
      </linearGradient>
      <filter id="og-curve-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="20" />
      </filter>
      <filter id="og-curve-soften" x="-15%" y="-15%" width="130%" height="130%">
        <feGaussianBlur stdDeviation="2.4" />
      </filter>
    </defs>

    <path
      d={brandCurvePath}
      fill="none"
      stroke="url(#og-curve-color)"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="58"
      filter="url(#og-curve-glow)"
      opacity="0.42"
    />
    <path
      d={brandCurvePath}
      fill="none"
      stroke="url(#og-curve-color)"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="32"
      opacity="0.38"
    />
    <path
      d={brandCurvePath}
      fill="none"
      stroke="url(#og-curve-shine)"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="18"
      filter="url(#og-curve-soften)"
      opacity="0.3"
    />
    <path
      d={brandCurvePath}
      fill="none"
      stroke="url(#og-curve-shine)"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
      transform="translate(-3 -4)"
      opacity="0.58"
    />
  </svg>
);

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

function renderOpenGraphImage({
  brandIconSrc,
  headline,
  description,
  footerLeft,
  footerRight,
}: {
  brandIconSrc: string;
  headline: string;
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
        position: "relative",
        overflow: "hidden",
        background: "#f9f6ff",
        color: "#191121",
        fontFamily: "sans-serif",
      }}
    >
      {openGraphCurve}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 64,
          left: 72,
          alignItems: "center",
          gap: 18,
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        {/* Same brand icon the site header uses; the PNG carries its own
            rounded dark background, so no wrapper box. */}
        <img src={brandIconSrc} width={36} height={36} />
        Threads Analytics
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 190,
          left: 72,
          maxWidth: 940,
          fontSize: 74,
          lineHeight: 1.02,
          letterSpacing: "-0.05em",
          fontWeight: 650,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 390,
          left: 72,
          maxWidth: 820,
          fontSize: 24,
          color: "#66635e",
          lineHeight: 1.45,
        }}
      >
        {description}
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 72,
          bottom: 64,
          left: 72,
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 19,
          color: "#77736d",
        }}
      >
        {footerLeft}
        {footerRight}
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

const variants: OgVariant[] = [
  {
    prefix: "",
    render: (locale, brandIconSrc) => {
      const copy = getDictionary(locale);
      return renderOpenGraphImage({
        brandIconSrc,
        headline: `${copy.hero.lineOne} ${copy.hero.lineTwo}`,
        description: copy.metadata.description,
        footerLeft: <span>15+ ANALYSES · SELF-HOSTED</span>,
        footerRight: (
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#9253e8" }}>
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
        headline: `${copy.hero.lineOne} ${copy.hero.lineTwo}`,
        description: copy.metadata.description,
        footerLeft: <span>{copy.hero.kicker}</span>,
        footerRight: (
          <span style={{ display: "flex", alignItems: "center", gap: 12, color: "#191121" }}>
            <Railway width={26} height={26} />
            Railway
          </span>
        ),
      });
    },
  },
  {
    prefix: "zeabur-agent",
    render: (locale, brandIconSrc) => {
      const copy = getDictionary(locale).zeaburAgentDeploy;
      return renderOpenGraphImage({
        brandIconSrc,
        headline: `${copy.hero.lineOne} ${copy.hero.lineTwo}`,
        description: copy.metadata.description,
        footerLeft: <span>{copy.hero.kicker}</span>,
        footerRight: (
          <span style={{ display: "flex", alignItems: "center", gap: 12, color: "#191121" }}>
            <Zeabur width={30} height={23} />
            Zeabur
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
        headline: `${copy.hero.lineOne} ${copy.hero.lineTwo}`,
        description: copy.metadata.description,
        footerLeft: <span>{copy.hero.kicker}</span>,
        footerRight: (
          <span style={{ display: "flex", alignItems: "center", gap: 12, color: "#191121" }}>
            <Vercel width={26} height={23} />
            Vercel
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
