import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { SectionHead } from "@/components/section-head";
import { gettingStarted } from "@/lib/getting-started";
import { getGuide, guideSlugs, guideUi } from "@/lib/guides";
import type { Locale } from "@/lib/locales";

export function HomeFaq({ locale }: { locale: Locale }) {
  const copy = gettingStarted[locale];
  const ui = guideUi[locale];

  return (
    <section className="home-section" id="faq" aria-labelledby="faq-title">
      <div className="site-shell home-faq">
        <div data-reveal="up">
          <SectionHead
            kicker={copy.kicker}
            title={<span id="faq-title">{copy.title}</span>}
            description={copy.description}
          />
        </div>
        <div className="home-faq-list" data-reveal="fade">
          {copy.items.map((item) => (
            <details className="home-faq-item" key={item.question}>
              <summary>
                {item.question}
                <Plus aria-hidden="true" strokeWidth={1.8} />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
        <nav className="home-faq-links" aria-label={ui.relatedKicker} data-reveal="fade">
          <Link href={`/${locale}/token-guide`}>
            {copy.tokenLink}
            <ArrowRight aria-hidden="true" strokeWidth={2} />
          </Link>
          <Link href={`/${locale}/analytics`}>
            {copy.chartsLink}
            <ArrowRight aria-hidden="true" strokeWidth={2} />
          </Link>
          {guideSlugs.map((slug) => (
            <Link href={`/${locale}/guides/${slug}`} key={slug}>
              {getGuide(slug, locale).navTitle}
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
          ))}
          <Link href={`/${locale}/guides`}>
            {ui.allGuides}
            <ArrowRight aria-hidden="true" strokeWidth={2} />
          </Link>
        </nav>
      </div>
    </section>
  );
}
