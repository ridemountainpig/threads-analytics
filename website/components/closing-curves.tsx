const closingCurvePath =
  "M55 560 C145 360 275 350 365 515 C455 680 590 570 644 350 C690 164 786 180 868 70";

export function ClosingCurves() {
  return (
    <div className="closing-curves" data-reveal="curve" aria-hidden="true">
      <svg viewBox="0 0 900 650" preserveAspectRatio="xMidYMid meet" focusable="false">
        <defs>
          <linearGradient
            id="closing-curve-color"
            x1="48"
            y1="575"
            x2="860"
            y2="91"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#ffb18a" />
            <stop offset="0.28" stopColor="#f58bc4" />
            <stop offset="0.66" stopColor="#ce67e5" />
            <stop offset="1" stopColor="#a45ff0" />
          </linearGradient>
          <linearGradient
            id="closing-curve-shine"
            x1="48"
            y1="575"
            x2="860"
            y2="91"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#fff4e8" stopOpacity="0.94" />
            <stop offset="0.5" stopColor="#ffe7f5" stopOpacity="0.76" />
            <stop offset="1" stopColor="#f6eaff" stopOpacity="0.58" />
          </linearGradient>
          <filter
            id="closing-curve-glow"
            x="-120"
            y="-120"
            width="1140"
            height="900"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="20" />
          </filter>
          <filter
            id="closing-curve-soften"
            x="-50"
            y="-50"
            width="1000"
            height="750"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        <g transform="translate(0 -70)">
          <g
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#closing-curve-glow)"
            opacity="0.42"
          >
            <path
              className="closing-curve-path"
              d={closingCurvePath}
              pathLength="1"
              stroke="url(#closing-curve-color)"
              strokeWidth="58"
            />
          </g>

          <path
            className="closing-curve-path"
            d={closingCurvePath}
            pathLength="1"
            fill="none"
            stroke="url(#closing-curve-color)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="32"
            opacity="0.38"
          />

          <path
            className="closing-curve-path"
            d={closingCurvePath}
            pathLength="1"
            fill="none"
            stroke="url(#closing-curve-shine)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="18"
            filter="url(#closing-curve-soften)"
            opacity="0.3"
          />

          <path
            className="closing-curve-path"
            d={closingCurvePath}
            pathLength="1"
            fill="none"
            stroke="url(#closing-curve-shine)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
            transform="translate(-3 -4)"
            opacity="0.58"
          />

          <path
            className="closing-curve-spark"
            d={closingCurvePath}
            pathLength="1"
            fill="none"
            stroke="url(#closing-curve-shine)"
            strokeLinecap="round"
            strokeWidth="7"
            transform="translate(-3 -4)"
          />
        </g>
      </svg>
    </div>
  );
}
