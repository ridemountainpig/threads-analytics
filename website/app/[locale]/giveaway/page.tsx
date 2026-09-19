import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, KeyRound, ShieldCheck, Ticket } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { ClosingCurves } from "@/components/closing-curves";
import { GiveawayDrawDemo } from "@/components/giveaway-draw-demo";
import { GiveawayWinnersCard } from "@/components/giveaway-winners-card";
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
  const copy = getDictionary(locale).giveawayGuide;

  return localizedPageMetadata({
    locale,
    path: "/giveaway",
    title: copy.metadata.title,
    description: copy.metadata.description,
    ogImageSet: "giveaway",
  });
}

export default async function GiveawayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const copy = dictionary.giveawayGuide;

  return (
    <>
      <JsonLd
        data={getDeployPageStructuredData({
          locale,
          path: "/giveaway",
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
                  <Ticket focusable="false" strokeWidth={2.2} />
                </span>
                {copy.hero.kicker}
              </p>
              <h1>
                <span>{copy.hero.lineOne}</span>
                <em>{copy.hero.lineTwo}</em>
              </h1>
              <p className="hero-description">{copy.hero.description}</p>
              <div className="hero-actions">
                <a href="#draw" className="button button-primary">
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
                <GiveawayWinnersCard copy={copy.hero.resultCard} />
                <p className="agent-prompt-hint giveaway-hero-hint">{copy.hero.hint}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="agent-steps-section">
          <div className="site-shell">
            <div data-reveal="up">
              <div className="section-heading">
                <p className="section-kicker">{copy.how.kicker}</p>
                <h2>{copy.how.title}</h2>
                <p className="section-description">{copy.how.description}</p>
              </div>
            </div>
            <ol
              className="mcp-steps-strip giveaway-steps-strip"
              data-reveal="stagger"
              data-reveal-delay="1"
            >
              {copy.how.steps.map((step) => (
                <li key={step.index}>
                  <span className="mcp-step-num" aria-hidden="true">
                    {step.index}
                  </span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="agent-steps-section">
          <div className="site-shell">
            <div data-reveal="up">
              <div className="section-heading">
                <p className="section-kicker">{copy.conditions.kicker}</p>
                <h2>{copy.conditions.title}</h2>
                <p className="section-description">{copy.conditions.description}</p>
              </div>
            </div>
            <div className="mcp-tools-panel" data-reveal="scale" data-reveal-delay="1">
              <div className="mcp-tools-head">
                <span className="mcp-tools-name">threads-analytics · giveaway</span>
                <span className="mcp-tools-badge">{copy.conditions.panelBadge}</span>
              </div>
              <div className="mcp-tools-list">
                {copy.conditions.items.map((item) => (
                  <div key={item.tag} className="mcp-tool-row">
                    <code>{item.tag}</code>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="agent-steps-section" id="draw">
          <div className="site-shell">
            <div data-reveal="up">
              <div className="section-heading">
                <p className="section-kicker">{copy.demo.kicker}</p>
                <h2>{copy.demo.title}</h2>
                <p className="section-description">{copy.demo.description}</p>
              </div>
            </div>
            <div data-reveal="scale" data-reveal-delay="1">
              <GiveawayDrawDemo copy={copy.demo} />
            </div>
            <p className="giveaway-demo-note" data-reveal="fade">
              {copy.demo.note}
            </p>
          </div>
        </section>

        <section className="agent-steps-section">
          <div className="site-shell">
            <div data-reveal="up">
              <div className="section-heading">
                <p className="section-kicker">{copy.fairness.kicker}</p>
                <h2>{copy.fairness.title}</h2>
                <p className="section-description">{copy.fairness.description}</p>
              </div>
            </div>
            <div
              className="agent-steps-grid giveaway-fairness-grid"
              data-reveal="stagger"
              data-reveal-delay="1"
            >
              {copy.fairness.items.map((item) => (
                <article className="agent-step-card" key={item.index}>
                  <span className="agent-step-index">{item.index}</span>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
            <div className="giveaway-token-note" data-reveal="up">
              <span className="giveaway-token-mark" aria-hidden="true">
                <KeyRound strokeWidth={2} />
              </span>
              <p>{copy.fairness.tokenNote}</p>
              <Link href={`/${locale}/token-guide`} className="giveaway-token-link">
                {copy.fairness.tokenCta}
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </Link>
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
                  <ShieldCheck aria-hidden="true" strokeWidth={2} />
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
