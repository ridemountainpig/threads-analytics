import { ImageResponse } from "next/og";
import { brandCurvePath } from "@/lib/brand-curve";
import { getDictionary, isLocale } from "@/lib/i18n";

export const alt = "Threads Analytics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = getDictionary(isLocale(locale) ? locale : "en");

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
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "#171023",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ee83c0",
          }}
        >
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
        </div>
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
        {`${copy.hero.lineOne} ${copy.hero.lineTwo}`}
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
        {copy.metadata.description}
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 72,
          bottom: 64,
          left: 72,
          justifyContent: "space-between",
          fontSize: 19,
          color: "#77736d",
        }}
      >
        <span>15+ ANALYSES · SELF-HOSTED</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#9253e8" }}>
          OPEN SOURCE
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
        </span>
      </div>
    </div>,
    size,
  );
}
