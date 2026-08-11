"use client";

import { useState, type CSSProperties } from "react";
import {
  ChartNoAxesCombined,
  Ellipsis,
  FileText,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Repeat2,
  Send,
  TrendingUp,
} from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";

const chartBars = [42, 58, 36, 68, 51, 82, 48, 63, 92, 57, 74, 64, 86, 69];

const dashboardCopy: Record<
  Locale,
  {
    overview: string;
    analytics: string;
    posts: string;
    performance: string;
    totalViews: string;
    postsTracked: string;
    followers: string;
    engagement: string;
    synced: string;
  }
> = {
  en: {
    overview: "Overview",
    analytics: "Analytics",
    posts: "Posts",
    performance: "Performance",
    totalViews: "Total views",
    postsTracked: "Posts tracked",
    followers: "Followers",
    engagement: "Engagement",
    synced: "Synced",
  },
  "zh-TW": {
    overview: "總覽",
    analytics: "分析",
    posts: "貼文",
    performance: "成效表現",
    totalViews: "總觀看",
    postsTracked: "追蹤貼文",
    followers: "粉絲",
    engagement: "互動率",
    synced: "已同步",
  },
  ja: {
    overview: "概要",
    analytics: "分析",
    posts: "投稿",
    performance: "パフォーマンス",
    totalViews: "総閲覧数",
    postsTracked: "分析投稿",
    followers: "フォロワー",
    engagement: "反応率",
    synced: "同期済み",
  },
};

export function OriginPostVisual({ locale, copy }: { locale: Locale; copy: Dictionary["story"] }) {
  const [liked, setLiked] = useState(false);
  const labels = dashboardCopy[locale];
  const navItems = [
    { label: labels.overview, Icon: LayoutDashboard },
    { label: labels.analytics, Icon: ChartNoAxesCombined },
    { label: labels.posts, Icon: FileText },
  ];

  return (
    <figure className="origin-post-frame" data-reveal="scale" data-reveal-delay="1">
      <figcaption>{copy.marker}</figcaption>
      <article className="origin-thread-card render-deferred">
        <header className="origin-thread-author">
          <span className="origin-avatar" aria-hidden="true">
            <ChartNoAxesCombined strokeWidth={1.9} />
          </span>
          <div>
            <strong>yencheng_0802</strong>
            <span>2026-07-20</span>
          </div>
          <Ellipsis className="origin-more" aria-hidden="true" strokeWidth={1.9} />
        </header>

        <div className="origin-thread-body">
          <p>{copy.quote}</p>
          <p>{copy.description}</p>

          <div className="origin-dashboard-ui" aria-label={copy.imageAlt}>
            <div className="origin-dashboard-topbar">
              <div className="origin-dashboard-brand">
                <span aria-hidden="true">
                  <ChartNoAxesCombined strokeWidth={2.2} />
                </span>
                <strong>Threads Analytics</strong>
              </div>
              <span>
                <i /> {labels.synced}
              </span>
            </div>

            <div className="origin-dashboard-body">
              <nav className="origin-dashboard-nav" aria-label="Dashboard preview">
                {navItems.map(({ label, Icon }, index) => (
                  <span className={index === 1 ? "is-active" : undefined} key={label}>
                    <Icon aria-hidden="true" strokeWidth={2} />
                    {label}
                  </span>
                ))}
              </nav>

              <div className="origin-dashboard-content">
                <div className="origin-dashboard-heading">
                  <div>
                    <span>ANALYTICS / 30D</span>
                    <strong>{labels.performance}</strong>
                  </div>
                  <span>
                    <TrendingUp aria-hidden="true" strokeWidth={2} /> 28.4%
                  </span>
                </div>

                <div className="origin-metric-grid">
                  <div>
                    <span>{labels.totalViews}</span>
                    <strong>68,164</strong>
                  </div>
                  <div>
                    <span>{labels.postsTracked}</span>
                    <strong>749</strong>
                  </div>
                  <div>
                    <span>{labels.followers}</span>
                    <strong>2,953</strong>
                  </div>
                  <div>
                    <span>{labels.engagement}</span>
                    <strong>6.8%</strong>
                  </div>
                </div>

                <div className="origin-chart-card">
                  <div className="origin-chart-label">
                    <span>VIEWS / POST</span>
                    <span>01 — 30</span>
                  </div>
                  <div className="origin-chart-bars" aria-hidden="true">
                    {chartBars.map((height, index) => (
                      <i
                        key={`${height}-${index}`}
                        style={
                          {
                            "--origin-bar": `${height}%`,
                            "--origin-bar-delay": `${index * 40}ms`,
                          } as CSSProperties
                        }
                      />
                    ))}
                    <svg viewBox="0 0 460 100" preserveAspectRatio="none">
                      <path d="M0 82 C34 78 47 59 76 68 S124 49 153 61 S203 30 234 48 S279 20 314 39 S365 21 402 29 S438 10 460 18" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="origin-thread-actions" aria-label="Post engagement">
          <button
            type="button"
            className={liked ? "origin-like is-liked" : "origin-like"}
            aria-pressed={liked}
            aria-label="Like"
            onClick={() => setLiked((value) => !value)}
          >
            <Heart aria-hidden="true" strokeWidth={1.75} /> {247 + (liked ? 1 : 0)}
          </button>
          <span>
            <MessageCircle aria-hidden="true" strokeWidth={1.75} /> 29
          </span>
          <span>
            <Repeat2 aria-hidden="true" strokeWidth={1.75} /> 35
          </span>
          <span>
            <Send aria-hidden="true" strokeWidth={1.75} /> 156
          </span>
        </footer>
      </article>
    </figure>
  );
}
