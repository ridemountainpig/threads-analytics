import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { AnalyticsDemo } from "@/components/analytics-demo";
import { ClosingCurves } from "@/components/closing-curves";
import { DeployTabsCard } from "@/components/deploy-tabs-card";
import { Railway, Vercel, Zeabur } from "@/components/deployment-logos";
import { FeatureGrid } from "@/components/feature-grid";
import { HeroCurve } from "@/components/hero-curve";
import { HeroVisual } from "@/components/hero-visual";
import { JsonLd } from "@/components/json-ld";
import { OriginPostVisual } from "@/components/origin-post-visual";
import { ProductPreview } from "@/components/product-preview";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Threads } from "@/components/threads-logo";
import { AnchorScrollController } from "@/components/anchor-scroll-controller";
import { ViewportRevealController } from "@/components/viewport-reveal-controller";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";
import { getStructuredData } from "@/lib/structured-data";

function SectionHeading({
  kicker,
  title,
  description,
  inverse = false,
}: {
  kicker: string;
  title: string;
  description: string;
  inverse?: boolean;
}) {
  return (
    <div className={`section-heading${inverse ? "section-heading-inverse" : ""}`}>
      <p className="section-kicker">{kicker}</p>
      <h2>{title}</h2>
      <p className="section-description">{description}</p>
    </div>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const copy = getDictionary(locale);
  const structuredData = getStructuredData(locale, copy);

  return (
    <>
      <JsonLd data={structuredData} />
      <ViewportRevealController />
      <AnchorScrollController />
      <SiteHeader locale={locale} copy={copy.nav} />
      <main>
        <section className="hero-section" id="product">
          <div className="hero-grid-bg" aria-hidden="true" />
          <HeroCurve />
          <div className="site-shell hero-copy">
            <p className="hero-eyebrow">
              <span className="hero-eyebrow-logo" aria-hidden="true">
                <Threads focusable="false" />
              </span>
              {copy.hero.eyebrow}
            </p>
            <h1>
              <span>{copy.hero.lineOne}</span>
              <em>{copy.hero.lineTwo}</em>
            </h1>
            <p className="hero-description">{copy.hero.description}</p>
            <div className="hero-actions">
              <a href="#demo" className="button button-primary">
                {copy.hero.primaryCta}
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </a>
              <a
                href={siteConfig.github}
                target="_blank"
                rel="noreferrer"
                className="button button-secondary"
              >
                <FaGithub className="github-icon" aria-hidden="true" />
                {copy.hero.secondaryCta}
              </a>
            </div>
            <p className="hero-note">{copy.hero.note}</p>
          </div>
          <div className="site-shell hero-visual-shell">
            <HeroVisual copy={copy.heroDemo} />
          </div>
        </section>

        <section className="proof-strip" aria-label="Product highlights">
          <div className="site-shell proof-grid" data-reveal="stagger">
            {copy.proof.map((item) => (
              <div key={item.label}>
                <strong className={item.value.includes("/") ? "proof-value-slash" : undefined}>
                  {item.value}
                </strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="demo-section" id="demo">
          <div className="site-shell">
            <div data-reveal="up">
              <SectionHeading
                kicker={copy.demo.kicker}
                title={copy.demo.title}
                description={copy.demo.description}
                inverse
              />
            </div>
            <div className="render-deferred" data-reveal="scale" data-reveal-delay="1">
              <AnalyticsDemo copy={copy.demo} />
            </div>
          </div>
        </section>

        <section className="story-section" id="story">
          <div className="site-shell story-grid">
            <div className="story-copy" data-reveal="up">
              <SectionHeading
                kicker={copy.story.kicker}
                title={copy.story.title}
                description={copy.story.description}
              />
              <blockquote>{copy.story.quote}</blockquote>
            </div>
            <OriginPostVisual locale={locale} copy={copy.story} />
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="site-shell">
            <div data-reveal="up">
              <SectionHeading
                kicker={copy.features.kicker}
                title={copy.features.title}
                description={copy.features.description}
              />
            </div>
            <FeatureGrid copy={copy.features} />
          </div>
        </section>

        <section className="product-section">
          <div className="site-shell">
            <div data-reveal="up">
              <SectionHeading
                kicker={copy.product.kicker}
                title={copy.product.title}
                description={copy.product.description}
              />
            </div>
            <div
              className="product-frame render-deferred"
              data-reveal="scale"
              data-reveal-delay="1"
            >
              <div className="product-frame-bar">
                <div className="window-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="product-tabs">
                  {copy.product.labels.map((label, index) => (
                    <span className={index === 1 ? "is-active" : undefined} key={label}>
                      {label}
                    </span>
                  ))}
                </div>
                <span className="product-status">
                  <i /> SYNCED
                </span>
              </div>
              <div className="product-preview-wrap">
                <ProductPreview copy={copy.product} />
              </div>
            </div>
          </div>
        </section>

        <section className="deploy-section" id="deploy">
          <div className="site-shell">
            <div data-reveal="up">
              <SectionHeading
                kicker={copy.deploy.kicker}
                title={copy.deploy.title}
                description={copy.deploy.description}
              />
            </div>
            <div className="deploy-grid" data-reveal="stagger" data-reveal-delay="1">
              <DeployTabsCard
                copy={copy.deploy.railway}
                templateHref={siteConfig.railway}
                walkthroughHref={`/${locale}/deploy/railway-agent`}
                brandMark={
                  <span className="deploy-brand-mark deploy-brand-mark-railway" aria-hidden="true">
                    <Railway focusable="false" />
                  </span>
                }
              />
              <DeployTabsCard
                copy={copy.deploy.zeabur}
                templateHref={siteConfig.zeabur}
                walkthroughHref={`/${locale}/deploy/zeabur-agent`}
                brandMark={
                  <span className="deploy-brand-mark deploy-brand-mark-zeabur" aria-hidden="true">
                    <Zeabur focusable="false" />
                  </span>
                }
              />
              <Link
                href={`/${locale}/deploy/vercel-agent`}
                className="deploy-card deploy-card-vercel"
              >
                <span className="deploy-card-topline">
                  <span className="deploy-eyebrow">{copy.deploy.vercel.eyebrow}</span>
                  <span className="deploy-brand-mark deploy-brand-mark-vercel" aria-hidden="true">
                    <Vercel focusable="false" />
                  </span>
                </span>
                <strong>{copy.deploy.vercel.title}</strong>
                <p>{copy.deploy.vercel.body}</p>
                <span className="deploy-tab-action">
                  <span className="deploy-tab-action-text">{copy.deploy.vercel.action}</span>
                  <span className="deploy-tab-action-chip" aria-hidden="true">
                    <ArrowUpRight className="deploy-tab-action-arrow" strokeWidth={2} />
                  </span>
                </span>
              </Link>
              <a
                href={siteConfig.package}
                target="_blank"
                rel="noreferrer"
                className="deploy-card deploy-card-code"
              >
                <span className="deploy-card-topline">
                  <span className="deploy-eyebrow">{copy.deploy.docker.eyebrow}</span>
                  <span className="deploy-package-link">
                    <FaGithub aria-hidden="true" />
                    {copy.deploy.docker.action}
                    <ArrowUpRight aria-hidden="true" strokeWidth={2} />
                  </span>
                </span>
                <strong>{copy.deploy.docker.title}</strong>
                <p>{copy.deploy.docker.body}</p>
                <code>
                  <span>$</span> {copy.deploy.docker.command}
                </code>
              </a>
            </div>
          </div>
        </section>

        <section className="final-cta-section">
          <ClosingCurves />
          <div
            className="site-shell final-cta render-deferred"
            data-reveal="up"
            data-reveal-delay="2"
          >
            <p className="section-kicker">{copy.finalCta.kicker}</p>
            <h2>{copy.finalCta.title}</h2>
            <p>{copy.finalCta.description}</p>
            <div className="hero-actions">
              <a
                href={siteConfig.railway}
                target="_blank"
                rel="noreferrer"
                className="button button-light"
              >
                {copy.finalCta.primary}
                <ArrowUpRight aria-hidden="true" strokeWidth={2} />
              </a>
              <a
                href={siteConfig.github}
                target="_blank"
                rel="noreferrer"
                className="button button-ghost"
              >
                <FaGithub className="github-icon" aria-hidden="true" />
                {copy.finalCta.secondary}
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} copy={copy.footer} />
    </>
  );
}
