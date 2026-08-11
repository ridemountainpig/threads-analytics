"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  Ellipsis,
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  TrendingUp,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

type Format = "text" | "image" | "question";
type Range = "7d" | "30d" | "90d";

const formats: Format[] = ["text", "image", "question"];
const ranges: Range[] = ["7d", "30d", "90d"];

const series: Record<Format, Record<Range, number[]>> = {
  text: {
    "7d": [32, 44, 38, 54, 49, 68, 61],
    "30d": [28, 36, 46, 41, 58, 54, 72, 66, 81, 92],
    "90d": [24, 30, 35, 41, 38, 48, 45, 57, 54, 64, 71, 76, 83, 88],
  },
  image: {
    "7d": [42, 58, 49, 64, 72, 67, 82],
    "30d": [35, 45, 61, 55, 70, 76, 69, 88, 81, 96],
    "90d": [31, 38, 44, 50, 47, 58, 63, 67, 72, 70, 79, 84, 90, 94],
  },
  question: {
    "7d": [26, 40, 34, 52, 43, 57, 63],
    "30d": [22, 31, 42, 38, 49, 58, 52, 68, 73, 84],
    "90d": [20, 27, 32, 38, 35, 43, 49, 47, 56, 61, 64, 69, 75, 82],
  },
};

const metrics = {
  text: {
    views: 2840,
    engagement: 6.8,
    shares: 2.4,
    likes: 247,
    replies: 29,
    reposts: 35,
    shareCount: 156,
  },
  image: {
    views: 3420,
    engagement: 7.6,
    shares: 3.1,
    likes: 318,
    replies: 34,
    reposts: 47,
    shareCount: 181,
  },
  question: {
    views: 2250,
    engagement: 9.4,
    shares: 1.8,
    likes: 206,
    replies: 68,
    reposts: 22,
    shareCount: 94,
  },
} as const;

const rangeProfiles: Record<
  Range,
  {
    factor: number;
    engagementOffset: number;
    sharesOffset: number;
    viewsLift: string;
    engagementLift: string;
    sharesLift: string;
  }
> = {
  "7d": {
    factor: 0.86,
    engagementOffset: -0.7,
    sharesOffset: -0.4,
    viewsLift: "12.6%",
    engagementLift: "0.6 pt",
    sharesLift: "0.3 pt",
  },
  "30d": {
    factor: 1,
    engagementOffset: 0,
    sharesOffset: 0,
    viewsLift: "21.8%",
    engagementLift: "1.1 pt",
    sharesLift: "0.5 pt",
  },
  "90d": {
    factor: 1.14,
    engagementOffset: 0.6,
    sharesOffset: 0.5,
    viewsLift: "28.4%",
    engagementLift: "1.7 pt",
    sharesLift: "0.8 pt",
  },
};

function useCountUp(target: number, duration = 640) {
  const [display, setDisplay] = useState(target);
  const previousRef = useRef(target);

  useEffect(() => {
    const from = previousRef.current;
    previousRef.current = target;
    if (from === target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = reduceMotion ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(from + (target - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    // rAF pauses in hidden tabs; make sure the value still settles.
    const settle = setTimeout(() => setDisplay(target), duration + 120);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
    };
  }, [target, duration]);

  return display;
}

function pointsFor(values: number[]) {
  const width = 680;
  const height = 220;
  const paddingX = 18;
  const paddingY = 18;
  const max = 110;
  return values.map((value, index) => ({
    x: paddingX + (index * (width - paddingX * 2)) / (values.length - 1),
    y: height - paddingY - (value / max) * (height - paddingY * 2),
  }));
}

function linePath(values: number[]) {
  return pointsFor(values)
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
}

function areaPath(values: number[]) {
  const points = pointsFor(values);
  const first = points[0];
  const last = points.at(-1);
  return `${linePath(values)} L${last?.x ?? 0} 220 L${first?.x ?? 0} 220 Z`;
}

export function AnalyticsDemo({ copy }: { copy: Dictionary["demo"] }) {
  const [format, setFormat] = useState<Format>("text");
  const [range, setRange] = useState<Range>("30d");
  const [liked, setLiked] = useState(false);
  const activeSeries = series[format][range];
  const activeMetrics = metrics[format];
  const sample = copy.postSamples[format];
  const rangeProfile = rangeProfiles[range];
  const factor = rangeProfile.factor;
  const views = Math.round(useCountUp(Math.round((activeMetrics.views * factor) / 10) * 10));
  const engagement = `${useCountUp(
    activeMetrics.engagement + rangeProfile.engagementOffset,
  ).toFixed(1)}%`;
  const shares = `${useCountUp(activeMetrics.shares + rangeProfile.sharesOffset).toFixed(1)}%`;
  const likes = Math.round(useCountUp(Math.round(activeMetrics.likes * factor) + (liked ? 1 : 0)));
  const replies = Math.round(useCountUp(Math.round(activeMetrics.replies * factor)));
  const reposts = Math.round(useCountUp(Math.round(activeMetrics.reposts * factor)));
  const shareCount = Math.round(useCountUp(Math.round(activeMetrics.shareCount * factor)));

  return (
    <div className="analytics-demo">
      <div className="demo-controls">
        <div className="control-group">
          <span className="control-label">{copy.formatLabel}</span>
          <div className="segmented-control" role="group" aria-label={copy.formatLabel}>
            {formats.map((item) => (
              <button
                key={item}
                type="button"
                className={format === item ? "is-active" : undefined}
                aria-pressed={format === item}
                onClick={() => setFormat(item)}
              >
                {copy.formats[item]}
              </button>
            ))}
          </div>
        </div>
        <div className="control-group control-group-range">
          <span className="control-label">{copy.rangeLabel}</span>
          <div className="segmented-control" role="group" aria-label={copy.rangeLabel}>
            {ranges.map((item) => (
              <button
                key={item}
                type="button"
                className={range === item ? "is-active" : undefined}
                aria-pressed={range === item}
                onClick={() => setRange(item)}
              >
                {copy.ranges[item]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="demo-grid">
        <article className="thread-preview" aria-live="polite">
          <div className="thread-author">
            <span className="thread-avatar">YA</span>
            <div>
              <strong>your_account</strong>
              <span>{sample.label} · 2h</span>
            </div>
            <button type="button" className="thread-more" aria-label="More actions">
              <Ellipsis aria-hidden="true" strokeWidth={1.9} />
            </button>
          </div>
          <p className="thread-copy demo-swap" key={`${format}-${range}`}>
            <span className="thread-range-context">
              {copy.rangeLabel} · {copy.ranges[range]}
            </span>
            {sample.content}
          </p>
          <span className="thread-tag">{sample.tag}</span>
          {format === "image" ? (
            <div className="thread-image demo-expand" aria-label="Analytics dashboard preview">
              <div className="thread-image-grid" />
              <div className="thread-image-line" />
              <span>CONTENT × TIME</span>
            </div>
          ) : null}
          <div className="thread-actions">
            <button
              type="button"
              className={liked ? "thread-like is-liked" : "thread-like"}
              aria-pressed={liked}
              aria-label={copy.likes}
              onClick={() => setLiked((value) => !value)}
            >
              <Heart aria-hidden="true" strokeWidth={1.8} /> {likes}
            </button>
            <span title={copy.replies}>
              <MessageCircle aria-hidden="true" strokeWidth={1.8} /> {replies}
            </span>
            <span title={copy.reposts}>
              <Repeat2 aria-hidden="true" strokeWidth={1.8} /> {reposts}
            </span>
            <span title={copy.sharesLabel}>
              <Send aria-hidden="true" strokeWidth={1.8} /> {shareCount}
            </span>
          </div>
        </article>

        <div className="analysis-panel">
          <div className="metric-row demo-swap" key={`${format}-${range}`}>
            <div>
              <span>{copy.views}</span>
              <strong>{views.toLocaleString()}</strong>
              <small>
                <TrendingUp aria-hidden="true" strokeWidth={2} /> {rangeProfile.viewsLift}
              </small>
            </div>
            <div>
              <span>{copy.engagement}</span>
              <strong>{engagement}</strong>
              <small>
                <TrendingUp aria-hidden="true" strokeWidth={2} /> {rangeProfile.engagementLift}
              </small>
            </div>
            <div>
              <span>{copy.shares}</span>
              <strong>{shares}</strong>
              <small>
                <TrendingUp aria-hidden="true" strokeWidth={2} /> {rangeProfile.sharesLift}
              </small>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-heading">
              <div>
                <strong>{copy.chartTitle}</strong>
                <span>{copy.chartSubtitle}</span>
              </div>
              <span className="demo-disclaimer">{copy.disclaimer}</span>
            </div>
            <div className="demo-chart-wrap">
              <svg
                key={`${format}-${range}`}
                className="demo-chart demo-swap"
                viewBox="0 0 680 220"
                preserveAspectRatio="none"
                role="img"
                aria-label={copy.chartTitle}
              >
                <defs>
                  <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#b06cff" stopOpacity="0.38" />
                    <stop offset="0.55" stopColor="#ed79bb" stopOpacity="0.14" />
                    <stop offset="1" stopColor="#ed79bb" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="chart-line-color" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0" stopColor="#f39acb" />
                    <stop offset="0.52" stopColor="#ec7dbc" />
                    <stop offset="1" stopColor="#a968f5" />
                  </linearGradient>
                  <clipPath id="chart-line-reveal">
                    <rect className="chart-line-clip" x="0" y="-10" width="680" height="240" />
                  </clipPath>
                </defs>
                <g className="chart-grid-lines">
                  <path d="M0 44H680M0 88H680M0 132H680M0 176H680" />
                </g>
                <path className="chart-baseline" d="M0 144H680" />
                <path className="chart-area" d={areaPath(activeSeries)} />
                <path
                  className="chart-line"
                  d={linePath(activeSeries)}
                  stroke="url(#chart-line-color)"
                  clipPath="url(#chart-line-reveal)"
                />
                {pointsFor(activeSeries).map((point, index) => (
                  <circle
                    key={`${point.x}-${point.y}`}
                    className={
                      index === activeSeries.length - 1 ? "chart-point is-last" : "chart-point"
                    }
                    cx={point.x}
                    cy={point.y}
                    r={index === activeSeries.length - 1 ? 5 : 2.5}
                    style={
                      {
                        "--point-delay": `${160 + (index * 620) / activeSeries.length}ms`,
                      } as CSSProperties
                    }
                  />
                ))}
              </svg>
              <div className="baseline-label">{copy.baseline}</div>
              <div className="chart-axis-labels" aria-hidden="true">
                <span>08</span>
                <span>11</span>
                <span>14</span>
                <span>17</span>
                <span>20</span>
                <span>23</span>
              </div>
            </div>
          </div>

          <div className="recommendation-card" key={`recommendation-${format}-${range}`}>
            <span>{copy.recommendation}</span>
            <p>
              {copy.recommendations[format]} {copy.rangeNotes[range]}
            </p>
            <ArrowRight aria-hidden="true" strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
