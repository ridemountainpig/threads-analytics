import Image from "next/image";
import type { Dictionary, Locale } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";

// docs/ ships one analytics reference per locale.
const analyticsDocFile: Record<Locale, string> = {
  en: "analytics.md",
  "zh-TW": "analytics-zh.md",
  ja: "analytics-ja.md",
};

export function SiteFooter({ locale, copy }: { locale: Locale; copy: Dictionary["footer"] }) {
  return (
    <footer className="site-footer">
      <div className="site-shell footer-grid render-deferred" data-reveal="stagger">
        <div className="footer-brand">
          <div className="brand-link">
            <Image
              src="/media/threads-analytics-icon.png"
              alt=""
              width={28}
              height={28}
              className="brand-icon"
            />
            <span>Threads Analytics</span>
          </div>
          <p>{copy.description}</p>
        </div>
        {/* Same split as the primary nav: capabilities, deployment, reading. */}
        <div>
          <strong>{copy.product}</strong>
          <a href={`/${locale}#demo`}>{copy.liveDemo}</a>
          <a href={`/${locale}/analytics`}>{copy.analytics}</a>
          <a href={`/${locale}/mcp`}>{copy.mcp}</a>
          <a href={`/${locale}/giveaway`}>{copy.giveaway}</a>
        </div>
        <div>
          <strong>{copy.deploy}</strong>
          <a href={`/${locale}#deploy`}>{copy.deployment}</a>
          <a href={`/${locale}/deploy/railway-agent`}>{copy.railwayAgent}</a>
          <a href={`/${locale}/deploy/zeabur-agent`}>{copy.zeaburAgent}</a>
          <a href={`/${locale}/deploy/vercel-agent`}>{copy.vercelAgent}</a>
        </div>
        <div>
          <strong>{copy.resources}</strong>
          <a href={`/${locale}/token-guide`}>{copy.tokenGuide}</a>
          <a
            href={`${siteConfig.github}/blob/main/docs/${analyticsDocFile[locale]}`}
            target="_blank"
            rel="noreferrer"
          >
            {copy.analyticsReference}
          </a>
          <a href={siteConfig.github} target="_blank" rel="noreferrer">
            {copy.source}
          </a>
          <a href={`${siteConfig.github}#readme`} target="_blank" rel="noreferrer">
            {copy.readme}
          </a>
        </div>
      </div>
      <div className="site-shell footer-bottom" data-reveal="fade" data-reveal-delay="1">
        <span className="footer-credit">
          © {new Date().getFullYear()} Threads Analytics ·{" "}
          <a href={`${siteConfig.github}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
            {copy.license}
          </a>
        </span>
        <span className="footer-credit">
          Built by{" "}
          <a href={siteConfig.creator} target="_blank" rel="noreferrer">
            Yen Cheng
          </a>
        </span>
      </div>
    </footer>
  );
}
