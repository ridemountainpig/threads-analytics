import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getGuide, guideSlugs, guideUi, type GuideSlug } from "@/lib/guides";
import type { Locale } from "@/lib/locales";

/** One card per guide: title, summary and a read-more cue. */
export function GuideCards({ locale, exclude }: { locale: Locale; exclude?: GuideSlug }) {
  const ui = guideUi[locale];

  return (
    <div className="guide-links-grid">
      {guideSlugs
        .filter((slug) => slug !== exclude)
        .map((slug) => {
          const guide = getGuide(slug, locale);
          const id = `guide-link-${slug}`;
          return (
            <Link
              key={slug}
              href={`/${locale}/guides/${slug}`}
              className="agent-step-card guide-link-card"
              aria-labelledby={`${id}-title`}
              aria-describedby={`${id}-description`}
            >
              <h3 id={`${id}-title`}>{guide.navTitle}</h3>
              <p id={`${id}-description`}>{guide.hero.description}</p>
              <span className="guide-link-cta">
                {ui.readMore}
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </span>
            </Link>
          );
        })}
    </div>
  );
}

export function GuideLinks({ locale, exclude }: { locale: Locale; exclude?: GuideSlug }) {
  const ui = guideUi[locale];

  return (
    <section className="guide-overview-section" aria-labelledby="guide-links-title">
      <div className="site-shell">
        <div className="section-heading">
          <p className="section-kicker">{ui.relatedKicker}</p>
          <h2 id="guide-links-title">{ui.relatedTitle}</h2>
          <p className="section-description">{ui.relatedDescription}</p>
        </div>
        <GuideCards locale={locale} exclude={exclude} />
        <Link href={`/${locale}/guides`} className="guide-links-all">
          {ui.allGuides}
          <ArrowRight aria-hidden="true" strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
