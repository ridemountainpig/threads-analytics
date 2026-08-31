import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, KeyRound, ListChecks, RefreshCw } from "lucide-react";
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
import { getTokenGuideStructuredData } from "@/lib/structured-data";

const metaDevelopersUrl = "https://developers.facebook.com/apps/";

// Screenshots live in public/token-guide/, resampled to 1720px wide from the
// originals in the app repo's public/token-generate-step/.
const shotWidth = 1720;
const shotHeights: Record<number, number> = { 1: 994, 3: 1132 };
const defaultShotHeight = 993;

// Steps that happen inside Threads instead of Meta for Developers — shown as
// the address label on the screenshot frame.
const threadsSteps = new Set([13, 14, 17]);

// Renders the dictionary's `**…**` markers (UI labels like button names) as
// bold without pulling in a markdown renderer.
function emphasize(text: string) {
  return text
    .split(/\*\*(.+?)\*\*/g)
    .map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

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
  const copy = getDictionary(locale).tokenGuide;

  return localizedPageMetadata({
    locale,
    path: "/token-guide",
    title: copy.metadata.title,
    description: copy.metadata.description,
    ogImageSet: "token-guide",
  });
}

export default async function TokenGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const copy = dictionary.tokenGuide;

  // Global step numbers per phase, derived from the phase step counts so the
  // dictionary never has to repeat them.
  const phaseOffsets = copy.phases.reduce<number[]>((offsets, phase, i) => {
    offsets.push(i === 0 ? 0 : offsets[i - 1] + copy.phases[i - 1].steps.length);
    return offsets;
  }, []);

  return (
    <>
      <JsonLd data={getTokenGuideStructuredData(locale, copy)} />
      <ViewportRevealController />
      <SiteHeader locale={locale} copy={dictionary.nav} />
      <main>
        <section className="agent-hero-section">
          <div className="hero-grid-bg" aria-hidden="true" />
          <HeroCurve />
          <div className="site-shell agent-hero-grid">
            <div className="agent-hero-copy">
              <p className="section-kicker">
                <span className="agent-hero-brandmark guide-hero-brandmark" aria-hidden="true">
                  <KeyRound focusable="false" strokeWidth={2.2} />
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
                <a
                  href={metaDevelopersUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-secondary"
                >
                  {copy.hero.secondaryCta}
                  <ArrowUpRight aria-hidden="true" strokeWidth={2} />
                </a>
              </div>
              <p className="hero-note">{copy.hero.note}</p>
            </div>
            <div className="agent-hero-side">
              <div className="guide-check-card">
                <span className="agent-prompt-label">
                  <ListChecks aria-hidden="true" />
                  {copy.hero.checklistLabel}
                </span>
                <ul className="guide-check-list">
                  {copy.hero.checklist.map((item) => (
                    <li key={item}>
                      <span className="guide-check-icon" aria-hidden="true">
                        <Check strokeWidth={2.6} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="guide-check-note">{copy.hero.checklistNote}</p>
                <div className="guide-token-result">
                  <span className="agent-prompt-label">
                    <KeyRound aria-hidden="true" />
                    {copy.hero.resultLabel}
                  </span>
                  <code className="guide-token-mask" aria-hidden="true">
                    THAA
                    <span>••••••••••••••••••••</span>
                    R6VZ
                  </code>
                  <span className="guide-token-value">{copy.hero.resultValue}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="guide-overview-section" id="overview">
          <div className="site-shell">
            <div data-reveal="up">
              <div className="section-heading">
                <p className="section-kicker">{copy.overview.kicker}</p>
                <h2>{copy.overview.title}</h2>
                <p className="section-description">{copy.overview.description}</p>
              </div>
            </div>
            <div className="guide-phase-grid" data-reveal="stagger" data-reveal-delay="1">
              {copy.phases.map((phase, i) => (
                <a
                  key={phase.index}
                  href={`#phase-${i + 1}`}
                  className="agent-step-card guide-phase-card"
                >
                  <span className="guide-phase-range">
                    {copy.stepsLabel} {phase.range}
                  </span>
                  <span className="agent-step-index">{phase.index}</span>
                  <strong>{phase.title}</strong>
                  <p>{phase.body}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="guide-steps-section">
          <div className="site-shell guide-steps-layout">
            <div className="guide-progress-rail">
              <GuideProgress
                label={copy.progressLabel}
                stepsLabel={copy.stepsLabel}
                phases={copy.phases}
              />
            </div>
            <div className="guide-steps-flow">
              {copy.phases.map((phase, i) => (
                <section key={phase.index} className="guide-phase" id={`phase-${i + 1}`}>
                  <div className="guide-phase-heading" data-reveal="up">
                    <p className="section-kicker">
                      {phase.index} / {copy.stepsLabel} {phase.range}
                    </p>
                    <h2>{phase.title}</h2>
                    <p className="section-description">{phase.body}</p>
                  </div>
                  {phase.steps.map((step, j) => {
                    const number = phaseOffsets[i] + j + 1;
                    return (
                      <article
                        key={step.title}
                        className="guide-step"
                        id={`step-${number}`}
                        data-reveal="up"
                      >
                        <div className="guide-step-rail" aria-hidden="true">
                          <span className="guide-step-num">{String(number).padStart(2, "0")}</span>
                        </div>
                        <div className="guide-step-content">
                          <h3>{step.title}</h3>
                          <p>{emphasize(step.body)}</p>
                          {step.bullets ? (
                            <ul className="guide-step-bullets">
                              {step.bullets.map((bullet) => (
                                <li key={bullet}>{emphasize(bullet)}</li>
                              ))}
                            </ul>
                          ) : null}
                          {step.note ? (
                            <p className="guide-step-note">{emphasize(step.note)}</p>
                          ) : null}
                          <figure className="guide-shot">
                            <figcaption className="guide-shot-bar">
                              <span className="window-dots" aria-hidden="true">
                                <span />
                                <span />
                                <span />
                              </span>
                              <span className="guide-shot-domain">
                                {threadsSteps.has(number)
                                  ? "threads.com"
                                  : "developers.facebook.com"}
                              </span>
                              <span className="guide-shot-step">
                                {copy.stepLabel} {number}
                              </span>
                            </figcaption>
                            <Image
                              src={`/token-guide/step-${number}.webp`}
                              alt={step.title}
                              width={shotWidth}
                              height={shotHeights[number] ?? defaultShotHeight}
                              sizes="(max-width: 1000px) calc(100vw - 48px), 812px"
                            />
                          </figure>
                        </div>
                      </article>
                    );
                  })}
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="agent-cta-section">
          <div className="site-shell" data-reveal="up">
            <div className="agent-cta guide-finish">
              <ClosingCurves />
              <div className="agent-cta-inner">
                <p className="section-kicker guide-finish-kicker">{copy.finish.kicker}</p>
                <h2>{copy.finish.title}</h2>
                <p>{emphasize(copy.finish.description)}</p>
                <div className="hero-actions">
                  <Link href={`/${locale}#deploy`} className="button button-light">
                    {copy.finish.primary}
                    <ArrowRight aria-hidden="true" strokeWidth={2} />
                  </Link>
                  <a
                    href={siteConfig.github}
                    target="_blank"
                    rel="noreferrer"
                    className="button button-ghost"
                  >
                    <FaGithub className="github-icon" aria-hidden="true" />
                    {copy.finish.secondary}
                  </a>
                </div>
                <p className="guide-finish-expiry">
                  <RefreshCw aria-hidden="true" strokeWidth={2} />
                  {copy.finish.expiry}
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
