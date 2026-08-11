import { brandCurvePath } from "@/lib/brand-curve";

export function HeroCurve() {
  return (
    <div className="hero-curve" aria-hidden="true">
      <svg viewBox="0 0 760 640" preserveAspectRatio="xMidYMid meet" focusable="false">
        <defs>
          <linearGradient
            id="hero-curve-color"
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
            id="hero-curve-shine"
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
          <filter
            id="hero-curve-glow"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="20" />
          </filter>
          <filter
            id="hero-curve-soften"
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#hero-curve-glow)"
          opacity="0.42"
        >
          <path
            className="hero-curve-path"
            d={brandCurvePath}
            pathLength="1"
            stroke="url(#hero-curve-color)"
            strokeWidth="58"
          />
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.36">
          <path
            className="hero-curve-path"
            d={brandCurvePath}
            pathLength="1"
            stroke="url(#hero-curve-color)"
            strokeWidth="32"
          />
        </g>

        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#hero-curve-soften)"
          opacity="0.3"
        >
          <path
            className="hero-curve-path"
            d={brandCurvePath}
            pathLength="1"
            stroke="url(#hero-curve-shine)"
            strokeWidth="18"
          />
        </g>

        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(-3 -4)"
          opacity="0.58"
        >
          <path
            className="hero-curve-path"
            d={brandCurvePath}
            pathLength="1"
            stroke="url(#hero-curve-shine)"
            strokeWidth="4"
          />
        </g>

        <path
          className="hero-curve-spark"
          d={brandCurvePath}
          pathLength="1"
          fill="none"
          stroke="url(#hero-curve-shine)"
          strokeLinecap="round"
          strokeWidth="7"
          transform="translate(-3 -4)"
        />
      </svg>
    </div>
  );
}
