"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Heart, MessageCircle, Repeat2, TrendingUp } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

const heroBars = [32, 48, 40, 58, 51, 72, 64, 93, 69, 82, 61, 76, 57, 70];
const postScores = ["8.4%", "7.6%", "6.9%"];

export function HeroVisual({ copy }: { copy: Dictionary["heroDemo"] }) {
  const visualRef = useRef<HTMLDivElement>(null);
  const posts = [copy.postOne, copy.postTwo, copy.postThree];

  useEffect(() => {
    const visual = visualRef.current;

    if (
      !visual ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    visual.classList.add("is-awaiting-view");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        visual.classList.remove("is-awaiting-view");
        visual.classList.add("is-in-view");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8%", threshold: 0.15 },
    );

    observer.observe(visual);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={visualRef} className="hero-visual" aria-label={`${copy.title}: ${copy.window}`}>
      <div className="demo-window-bar">
        <div className="window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span>analytics.local / overview</span>
        <span className="window-live">
          <i /> {copy.label}
        </span>
      </div>

      <div className="hero-dashboard">
        <div className="signal-card">
          <span className="signal-label">{copy.title}</span>
          <strong>{copy.window}</strong>
          <span className="signal-lift">
            <TrendingUp aria-hidden="true" strokeWidth={2} /> {copy.lift}
          </span>
        </div>

        <div className="micro-chart">
          <div className="chart-heading">
            <span>{copy.chartLabel}</span>
            <span>14 / 14</span>
          </div>
          <div className="bars" aria-hidden="true">
            {heroBars.map((height, index) => (
              <span
                key={`${height}-${index}`}
                className={index === 7 ? "is-peak" : undefined}
                style={
                  {
                    "--bar-height": `${height}%`,
                    "--bar-delay": `${620 + index * 42}ms`,
                  } as CSSProperties
                }
              />
            ))}
            <div className="hero-chart-trend">
              <svg viewBox="0 0 700 180" preserveAspectRatio="none">
                <path d="M0 150 C60 145, 75 122, 120 130 S190 106, 235 120 S310 80, 360 95 S420 43, 480 73 S545 55, 700 35" />
              </svg>
            </div>
          </div>
        </div>

        <div className="post-stack" aria-hidden="true">
          <div className="post-stack-heading">
            <span>{copy.postsLabel}</span>
            <span>{copy.postsMetric}</span>
          </div>
          {posts.map((post, index) => (
            <article
              className="mini-post"
              key={post}
              style={{ "--post-delay": `${760 + index * 120}ms` } as CSSProperties}
            >
              <span className="mini-post-rank">{String(index + 1).padStart(2, "0")}</span>
              <div className="mini-post-content">
                <div className="mini-post-meta">
                  <strong>@your_account</strong>
                  <span>{index + 1}h</span>
                </div>
                <p>{post}</p>
                <div className="mini-reactions">
                  <span>
                    <Heart aria-hidden="true" strokeWidth={1.8} /> {38 + index * 17}
                  </span>
                  <span>
                    <MessageCircle aria-hidden="true" strokeWidth={1.8} /> {8 + index * 4}
                  </span>
                  <span>
                    <Repeat2 aria-hidden="true" strokeWidth={1.8} /> {5 + index * 3}
                  </span>
                </div>
              </div>
              <span className="mini-post-score">
                <TrendingUp aria-hidden="true" strokeWidth={2} /> {postScores[index]}
              </span>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
