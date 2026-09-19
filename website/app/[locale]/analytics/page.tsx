import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChartNoAxesColumn, Info, Ruler } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { ClosingCurves } from "@/components/closing-curves";
import { GuideProgress } from "@/components/guide-progress";
import { HeroCurve } from "@/components/hero-curve";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ViewportRevealController } from "@/components/viewport-reveal-controller";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { localizedPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { getDeployPageStructuredData } from "@/lib/structured-data";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = getDictionary(locale).analyticsGuide;

  return localizedPageMetadata({
    locale,
    path: "/analytics",
    title: copy.metadata.title,
    description: copy.metadata.description,
    ogImageSet: "analytics",
  });
}

export default async function AnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const copy = dictionary.analyticsGuide;

  // The rail covers the five inventory sections plus the method section.
  const railPhases = [
    ...copy.sections.map((section) => ({
      index: section.index,
      title: section.title.replace(/[.。]$/, ""),
      range: section.railMeta,
    })),
    {
      index: copy.method.index,
      title: copy.method.title.replace(/[.。]$/, ""),
      range: copy.method.railMeta,
    },
  ];

  return (
    <>
      <JsonLd
        data={getDeployPageStructuredData({
          locale,
          path: "/analytics",
          title: copy.metadata.title,
        })}
      />
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
                  <ChartNoAxesColumn focusable="false" strokeWidth={2.2} />
                </span>
                {copy.hero.kicker}
              </p>
              <h1>
                <span>{copy.hero.lineOne}</span>
                <em>{copy.hero.lineTwo}</em>
              </h1>
              <p className="hero-description">{copy.hero.description}</p>
              <div className="hero-actions">
                <a href="#phase-1" className="button button-primary">
                  {copy.hero.primaryCta}
                  <ArrowRight aria-hidden="true" strokeWidth={2} />
                </a>
                <Link href={`/${locale}#deploy`} className="button button-secondary">
                  {copy.hero.secondaryCta}
                  <ArrowUpRight aria-hidden="true" strokeWidth={2} />
                </Link>
              </div>
              <p className="hero-note">{copy.hero.note}</p>
            </div>
            <div className="agent-hero-side">
              <div className="agent-prompt-stack">
                <div className="guide-check-card analytics-summary-card">
                  <div className="analytics-summary-head">
                    <span className="agent-prompt-label">{copy.hero.summary.label}</span>
                    <span className="analytics-summary-badge">{copy.hero.summary.badge}</span>
                  </div>
                  <p className="analytics-summary-total">
                    <strong>{copy.hero.summary.total}</strong>
                    <span>{copy.hero.summary.totalLabel}</span>
                  </p>
                  <ul className="analytics-summary-rows">
                    {copy.hero.summary.rows.map((row, index) => (
                      <li key={row.name}>
                        <a href={`#phase-${index + 1}`}>
                          <span>{row.name}</span>
                          <b>{row.count}</b>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="agent-prompt-hint analytics-hero-hint">{copy.hero.hint}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="guide-steps-section">
          <div className="site-shell guide-steps-layout">
            <div className="guide-progress-rail">
              <GuideProgress label={copy.railLabel} phases={railPhases} />
            </div>

            <div className="guide-steps-flow">
              {copy.sections.map((section, index) => (
                <section className="guide-phase" key={section.index} id={`phase-${index + 1}`}>
                  <div className="guide-phase-heading" data-reveal="up">
                    <p className="section-kicker">{section.kicker}</p>
                    <h2>{section.title}</h2>
                    <p className="section-description">{section.description}</p>
                  </div>

                  {section.stats ? (
                    <div className="analytics-stat-strip" data-reveal="up">
                      <span className="analytics-stat-label">{section.stats.label}</span>
                      <span className="analytics-stat-chips">
                        {section.stats.items.map((item) => (
                          <b key={item}>{item}</b>
                        ))}
                      </span>
                    </div>
                  ) : null}

                  <div className="mcp-tools-panel" data-reveal="scale">
                    <div className="mcp-tools-head">
                      <span className="mcp-tools-name">{section.panelName}</span>
                      <span className="mcp-tools-badge">{section.badge}</span>
                    </div>
                    <div className="mcp-tools-list">
                      {section.items.map((item, itemIndex) => (
                        <div key={item.name} className="mcp-tool-row">
                          <code>{String(itemIndex + 1).padStart(2, "0")}</code>
                          <strong>{item.name}</strong>
                          <p>{item.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {section.note ? (
                    <p className="analytics-section-note" data-reveal="fade">
                      <Info aria-hidden="true" strokeWidth={2} />
                      {section.note}
                    </p>
                  ) : null}
                </section>
              ))}

              <section className="guide-phase" id={`phase-${copy.sections.length + 1}`}>
                <div className="guide-phase-heading" data-reveal="up">
                  <p className="section-kicker">{copy.method.kicker}</p>
                  <h2>{copy.method.title}</h2>
                  <p className="section-description">{copy.method.description}</p>
                </div>
                <div className="analytics-method-grid" data-reveal="stagger">
                  {copy.method.items.map((item) => (
                    <article className="analytics-method-card" key={item.index}>
                      <span className="analytics-method-mark" aria-hidden="true">
                        <Ruler strokeWidth={2} />
                      </span>
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>
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
                  <ChartNoAxesColumn aria-hidden="true" strokeWidth={2} />
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
