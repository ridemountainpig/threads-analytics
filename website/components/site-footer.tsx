import Image from "next/image";
import type { Dictionary, Locale } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";

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
        <div>
          <strong>{copy.product}</strong>
          <a href={`/${locale}#demo`}>{copy.liveDemo}</a>
          <a href={`/${locale}#features`}>{copy.featureOverview}</a>
          <a href={`/${locale}#deploy`}>{copy.deployment}</a>
        </div>
        <div>
          <strong>{copy.resources}</strong>
          <a href={siteConfig.github} target="_blank" rel="noreferrer">
            {copy.source}
          </a>
          <a href={`${siteConfig.github}#readme`} target="_blank" rel="noreferrer">
            {copy.readme}
          </a>
        </div>
      </div>
      <div className="site-shell footer-bottom" data-reveal="fade" data-reveal-delay="1">
        <span>© {new Date().getFullYear()} Threads Analytics</span>
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
