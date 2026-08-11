import type { CSSProperties } from "react";
import {
  ChartNoAxesCombined,
  Clock3,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  Settings2,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

const previewBars = [36, 52, 44, 68, 61, 84, 57, 72, 49, 65, 92, 74, 58, 79] as const;
const previewPoints = [
  { x: "34.58%", y: "58.89%", isLast: false },
  { x: "68.47%", y: "30.56%", isLast: false },
  { x: "98.89%", y: "13.33%", isLast: true },
] as const;
const metricValues = ["2,840", "7.4%", "184", "96"] as const;
const metricTrends = ["+28.4%", "+1.7 pt", "+18.6%", "+12.2%"] as const;
const navIcons = [LayoutDashboard, ChartNoAxesCombined, FileText, Settings2] as const;

export function ProductPreview({ copy }: { copy: Dictionary["product"] }) {
  return (
    <div className="product-ui-preview" aria-hidden="true">
      <aside className="product-preview-sidebar">
        <div className="product-preview-brand">
          <span>TA</span>
          <div>
            <strong>Threads Analytics</strong>
            <small>@your_account</small>
          </div>
        </div>
        <div className="product-preview-nav">
          {copy.labels.map((label, index) => {
            const Icon = navIcons[index];
            return (
              <div className={index === 1 ? "is-active" : undefined} key={label}>
                <Icon strokeWidth={1.8} />
                <span>{label}</span>
              </div>
            );
          })}
        </div>
        <div className="product-preview-private">
          <LockKeyhole strokeWidth={1.8} />
          <span>{copy.preview.privateLabel}</span>
        </div>
      </aside>

      <div className="product-preview-canvas">
        <header className="product-preview-heading">
          <div>
            <small>{copy.preview.eyebrow}</small>
            <strong>{copy.preview.title}</strong>
          </div>
          <div className="product-preview-ranges">
            {copy.preview.ranges.map((range, index) => (
              <span className={index === 2 ? "is-active" : undefined} key={range}>
                {range}
              </span>
            ))}
          </div>
        </header>

        <div className="product-preview-signal">
          <Clock3 strokeWidth={1.8} />
          <div>
            <small>{copy.preview.signalLabel}</small>
            <strong>{copy.preview.signalValue}</strong>
          </div>
          <span>{copy.preview.confidence}</span>
        </div>

        <div className="product-preview-metrics">
          {copy.preview.metricLabels.map((label, index) => (
            <div key={label}>
              <small>{label}</small>
              <strong>{metricValues[index]}</strong>
              <span>{metricTrends[index]}</span>
            </div>
          ))}
        </div>

        <div className="product-preview-chart-card">
          <div className="product-preview-chart-heading">
            <div>
              <strong>{copy.preview.chartTitle}</strong>
              <small>{copy.preview.chartCaption}</small>
            </div>
            <span>{copy.preview.baseline}</span>
          </div>
          <div className="product-preview-chart">
            <div className="product-preview-bars">
              {previewBars.map((height, index) => (
                <i
                  key={`${height}-${index}`}
                  style={
                    {
                      "--preview-bar-height": `${height}%`,
                      "--preview-bar-delay": `${index * 45}ms`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <div className="product-preview-trend">
              <svg viewBox="0 0 720 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="product-preview-line" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#9e5bef" />
                    <stop offset="0.52" stopColor="#ec7dbc" />
                    <stop offset="1" stopColor="#ffb18a" />
                  </linearGradient>
                  <clipPath id="product-preview-line-reveal">
                    <rect
                      className="product-preview-line-clip"
                      x="0"
                      y="-10"
                      width="720"
                      height="200"
                    />
                  </clipPath>
                </defs>
                <path
                  d="M8 142 C58 137 84 112 132 118 S205 99 249 106 S326 67 375 78 S449 87 493 55 S580 68 620 42 S682 34 712 24"
                  fill="none"
                  stroke="url(#product-preview-line)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                  clipPath="url(#product-preview-line-reveal)"
                />
              </svg>
              {previewPoints.map((point) => (
                <i
                  className={
                    point.isLast ? "product-preview-point is-last" : "product-preview-point"
                  }
                  key={`${point.x}-${point.y}`}
                  style={
                    {
                      "--preview-point-x": point.x,
                      "--preview-point-y": point.y,
                      "--preview-point-delay": `${Math.round(
                        1050 + (parseFloat(point.x) / 100) * 1100,
                      )}ms`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
          </div>
          <div className="product-preview-axis">
            <span>08</span>
            <span>11</span>
            <span>14</span>
            <span>17</span>
            <span>20</span>
            <span>23</span>
          </div>
        </div>
      </div>
    </div>
  );
}
