import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { ClosingCurves } from "@/components/closing-curves";
import { HeroCurve } from "@/components/hero-curve";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ViewportRevealController } from "@/components/viewport-reveal-controller";
import { loadGuideBody } from "@/lib/content";
import { getGuide, guideHub, guideSlugs, guideUi } from "@/lib/guides";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { localizedPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { getGuideHubStructuredData } from "@/lib/structured-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = guideHub[locale];

  return localizedPageMetadata({
    locale,
    path: "/guides",
    title: copy.metadata.title,
    description: copy.metadata.description,
    ogImageSet: "guides",
  });
}

export default async function GuidesPage({ params }: { params: Params }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const copy = guideHub[locale];
  const ui = guideUi[locale];

  const bodies = await Promise.all(guideSlugs.map((slug) => loadGuideBody(slug, locale)));
  const entries = guideSlugs.map((slug, index) => {
    const guide = getGuide(slug, locale);
    return {
      slug,
      guide,
      href: `/${locale}/guides/${slug}`,
      index: String(index + 1).padStart(2, "0"),
      // Kickers read "Section / Topic"; the card pill shows just the topic.
      topic: guide.hero.kicker.split(" / ").slice(1).join(" / "),
      // readingTime is localized prose ("8 min read", "閱讀約 8 分鐘"); the
      // number in it is the one source of truth for the total.
      minutes: Number(guide.hero.readingTime.match(/\d+/)?.[0] ?? 0),
      // The first few section headings are enough to show what it covers.
      outline: bodies[index].headings
        .filter((heading) => heading.depth === 2)
        .map((heading) => heading.text)
        .slice(0, 4),
    };
  });
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);

  return (
    <>
      <JsonLd data={getGuideHubStructuredData(locale)} />
      <ViewportRevealController />
      <SiteHeader locale={locale} copy={dictionary.nav} />
      <main>
        <section className="agent-hero-section" data-motion-pause>
          <div className="hero-grid-bg" aria-hidden="true" />
          <HeroCurve />
          <div className="site-shell agent-hero-grid">
            <div className="agent-hero-copy">
              <p className="section-kicker">
                <span className="agent-hero-brandmark guide-hero-brandmark" aria-hidden="true">
                  <BookOpen focusable="false" strokeWidth={2.2} />
                </span>
                {copy.kicker}
              </p>
              <h1>
                <span>{copy.lineOne}</span>
                <em>{copy.lineTwo}</em>
              </h1>
              <p className="hero-description">{copy.description}</p>
              <div className="hero-actions">
                <Link href={entries[0].href} className="button button-primary">
                  {copy.primaryCta}
                  <ArrowRight aria-hidden="true" strokeWidth={2} />
                </Link>
                <Link href={`/${locale}/analytics`} className="button button-secondary">
                  {copy.secondaryCta}
                  <ArrowUpRight aria-hidden="true" strokeWidth={2} />
                </Link>
              </div>
              <p className="hero-note">{copy.note}</p>
            </div>
            <div className="agent-hero-side">
              <div className="agent-prompt-stack">
                <div className="guide-check-card analytics-summary-card">
                  <div className="analytics-summary-head">
                    <span className="agent-prompt-label">{copy.path.label}</span>
                    <span className="analytics-summary-badge">{copy.path.badge}</span>
                  </div>
                  <p className="analytics-summary-total">
                    <strong>{totalMinutes}</strong>
                    <span>{copy.path.totalLabel}</span>
                  </p>
                  <ol className="analytics-summary-rows guide-hub-path">
                    {entries.map((entry) => (
                      <li key={entry.slug}>
                        <Link href={entry.href}>
                          <span>
                            <i aria-hidden="true">{entry.index}</i>
                            {entry.guide.menuTitle}
                          </span>
                          <b>
                            {entry.minutes} {copy.path.minutes}
                          </b>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
                <p className="agent-prompt-hint analytics-hero-hint">{copy.path.hint}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="guide-overview-section" aria-labelledby="guide-hub-list-title">
          <div className="site-shell">
            <div className="section-heading" data-reveal="up">
              <p className="section-kicker">{copy.list.kicker}</p>
              <h2 id="guide-hub-list-title">{copy.list.title}</h2>
              <p className="section-description">{copy.list.description}</p>
            </div>
            <ol className="guide-hub-list" data-reveal="stagger">
              {entries.map((entry) => {
                const id = `guide-hub-${entry.slug}`;
                return (
                  <li key={entry.slug}>
                    <Link
                      href={entry.href}
                      className="agent-step-card guide-hub-row"
                      aria-labelledby={`${id}-title`}
                      aria-describedby={`${id}-description`}
                    >
                      <span className="guide-hub-index" aria-hidden="true">
                        {entry.index}
                      </span>
                      <div className="guide-hub-main">
                        <span className="guide-phase-range">{entry.topic}</span>
                        <h3 id={`${id}-title`}>{entry.guide.navTitle}</h3>
                        <p id={`${id}-description`}>{entry.guide.hero.description}</p>
                      </div>
                      <div className="guide-hub-outline">
                        <span className="guide-hub-outline-label">{copy.list.outlineLabel}</span>
                        <ul>
                          {entry.outline.map((heading) => (
                            <li key={heading}>{heading}</li>
                          ))}
                        </ul>
                        <div className="guide-hub-foot">
                          <span>{entry.guide.hero.readingTime}</span>
                          <span className="guide-link-cta">
                            {ui.readMore}
                            <ArrowRight aria-hidden="true" strokeWidth={2} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="agent-cta-section">
          <div className="site-shell" data-reveal="up">
            <div className="agent-cta guide-finish">
              <ClosingCurves />
              <div className="agent-cta-inner">
                <h2>{copy.cta.title}</h2>
                <p>{copy.cta.description}</p>
                <div className="hero-actions">
                  <Link href={`/${locale}#deploy`} className="button button-light">
                    {copy.cta.primary}
                    <ArrowRight aria-hidden="true" strokeWidth={2} />
                  </Link>
                  <a
                    href={siteConfig.github}
                    target="_blank"
                    rel="noreferrer"
                    className="button button-ghost"
                  >
                    <FaGithub className="github-icon" aria-hidden="true" />
                    {copy.cta.secondary}
                  </a>
                </div>
                <p className="guide-finish-expiry">
                  <BookOpen aria-hidden="true" strokeWidth={2} />
                  {copy.cta.note}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} copy={dictionary.footer} />
    </>
  );
}
