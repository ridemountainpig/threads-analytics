import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { FaApple, FaDocker, FaGithub } from "react-icons/fa6";
import { RiOpenaiFill } from "react-icons/ri";
import { SiClaude, SiClaudecode, SiCursor } from "react-icons/si";
import { AnalyticsDemo } from "@/components/analytics-demo";
import { AnchorScrollController } from "@/components/anchor-scroll-controller";
import { CommandPill } from "@/components/command-pill";
import { DeployTabsCard } from "@/components/deploy-tabs-card";
import { Railway, Vercel, Zeabur } from "@/components/deployment-logos";
import { FeatureGrid } from "@/components/feature-grid";
import { Frame } from "@/components/frame";
import { GiveawayWinnersCard } from "@/components/giveaway-winners-card";
import { HomeFaq } from "@/components/home-faq";
import { JsonLd } from "@/components/json-ld";
import { McpChatDemo } from "@/components/mcp-chat-demo";
import { OriginPostVisual } from "@/components/origin-post-visual";
import { ProductPreview } from "@/components/product-preview";
import { SectionHead } from "@/components/section-head";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ViewportRevealController } from "@/components/viewport-reveal-controller";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";
import { getStructuredData } from "@/lib/structured-data";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const copy = getDictionary(locale);
  const structuredData = getStructuredData(locale, copy);
  const { howItWorks } = copy;

  return (
    <>
      <JsonLd data={structuredData} />
      <ViewportRevealController />
      <AnchorScrollController />
      <SiteHeader locale={locale} copy={copy.nav} />
      <main className="home">
        <section className="home-hero" id="product">
          <div className="site-shell home-hero-copy">
            <Link href={`/${locale}/desktop`} className="home-announcement">
              <span className="home-announcement-dot" aria-hidden="true" />
              {copy.hero.announcement}
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <h1 className="home-hero-title">
              <span>{copy.hero.lineOne}</span> <span>{copy.hero.lineTwo}</span>
            </h1>
            <p className="home-hero-lead">{copy.hero.description}</p>
            <div className="home-hero-actions">
              <Link href={`/${locale}/desktop`} className="button button-primary">
                <FaApple aria-hidden="true" />
                {copy.hero.secondaryCta}
              </Link>
              <CommandPill
                command={copy.deploy.docker.command}
                copyLabel={copy.nav.copy}
                copiedLabel={copy.nav.copied}
              />
            </div>
            <p className="home-hero-note">
              {copy.hero.agentPrompt} <a href="#deploy">{copy.hero.agentLink}</a>
            </p>
          </div>

          <div className="site-shell home-hero-visual">
            <Frame
              className="home-hero-frame"
              label="localhost:3000/analytics"
              actions={
                <span className="home-frame-status">
                  <i aria-hidden="true" />
                  {copy.product.preview.privateLabel}
                </span>
              }
            >
              <ProductPreview copy={copy.product} />
            </Frame>
            <dl className="home-proof">
              {copy.proof.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="home-section" id="how-it-works">
          <div className="site-shell">
            <div data-reveal="up">
              <SectionHead
                kicker={howItWorks.kicker}
                title={howItWorks.title}
                description={howItWorks.description}
              />
            </div>
            <ol className="home-steps" data-reveal="stagger">
              {howItWorks.steps.map((step, index) => (
                <li className="home-step" key={step.title}>
                  <span className="home-step-index">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  {index === 0 ? (
                    <Link href={`/${locale}/token-guide`} className="home-step-link">
                      {howItWorks.tokenLink}
                      <ArrowRight aria-hidden="true" strokeWidth={2} />
                    </Link>
                  ) : null}
                  <div className="home-step-snippet">
                    {step.code ? (
                      <code>{step.code}</code>
                    ) : (
                      <span className="home-step-platforms" aria-hidden="true">
                        <FaApple />
                        <Railway />
                        <Zeabur />
                        <Vercel />
                        <FaDocker />
                      </span>
                    )}
                    <span className="home-step-status">
                      <Check aria-hidden="true" strokeWidth={2} />
                      {step.status}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="home-section" id="demo">
          <div className="site-shell">
            <div data-reveal="up">
              <SectionHead
                kicker={copy.demo.kicker}
                title={copy.demo.title}
                description={copy.demo.description}
              />
            </div>
            <div
              className="stage home-demo-stage render-deferred"
              data-reveal="scale"
              data-reveal-delay="1"
              data-motion-pause
            >
              <AnalyticsDemo copy={copy.demo} />
            </div>
          </div>
        </section>

        <section className="home-section" id="features">
          <div className="site-shell">
            <div data-reveal="up">
              <SectionHead
                kicker={copy.features.kicker}
                title={copy.features.title}
                description={copy.features.description}
              />
            </div>
            <FeatureGrid copy={copy.features} />
            <div className="home-section-cta" data-reveal="fade">
              <Link href={`/${locale}/analytics`} className="button button-secondary">
                {copy.features.cta}
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </section>

        <section className="home-section" id="built-in">
          <div className="site-shell">
            <div data-reveal="up">
              <SectionHead
                kicker={copy.builtIn.kicker}
                title={copy.builtIn.title}
                description={copy.builtIn.description}
              />
            </div>
            <div className="home-duo" data-reveal="stagger">
              <article className="home-card" id="mcp">
                <div className="home-card-visual home-card-visual-mcp">
                  <McpChatDemo
                    label={copy.mcpGuide.usage.examplesLabel}
                    examples={copy.mcpGuide.usage.examples}
                    note={copy.mcpGuide.usage.examplesNote}
                  />
                </div>
                <div className="home-card-body">
                  <p className="home-card-kicker">{copy.mcpHome.kicker}</p>
                  <h3>{copy.mcpHome.title}</h3>
                  <p>{copy.mcpHome.description}</p>
                  <ul className="home-agents" aria-label={copy.mcpGuide.hero.worksWith}>
                    <li>
                      <SiClaudecode aria-hidden="true" />
                      Claude Code
                    </li>
                    <li>
                      <SiClaude aria-hidden="true" />
                      Claude
                    </li>
                    <li>
                      <RiOpenaiFill aria-hidden="true" />
                      Codex
                    </li>
                    <li>
                      <SiCursor aria-hidden="true" />
                      Cursor
                    </li>
                    <li className="home-agents-more">{copy.mcpGuide.hero.moreAgents}</li>
                  </ul>
                  <div className="home-card-footer">
                    <Link href={`/${locale}/mcp`} className="home-card-link">
                      {copy.mcpHome.cta}
                      <ArrowRight aria-hidden="true" strokeWidth={2} />
                    </Link>
                    <span className="home-card-note">{copy.mcpHome.note}</span>
                  </div>
                </div>
              </article>
              <article className="home-card" id="giveaway">
                <div className="home-card-visual">
                  <GiveawayWinnersCard copy={copy.giveawayGuide.hero.resultCard} />
                </div>
                <div className="home-card-body">
                  <p className="home-card-kicker">{copy.giveawayHome.kicker}</p>
                  <h3>{copy.giveawayHome.title}</h3>
                  <p>{copy.giveawayHome.description}</p>
                  <div className="home-card-footer">
                    <Link href={`/${locale}/giveaway`} className="home-card-link">
                      {copy.giveawayHome.cta}
                      <ArrowRight aria-hidden="true" strokeWidth={2} />
                    </Link>
                    <span className="home-card-note">{copy.giveawayHome.note}</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="home-section" id="story">
          <div className="site-shell">
            <div data-reveal="up">
              <SectionHead
                kicker={copy.story.kicker}
                title={copy.story.title}
                description={copy.story.description}
              />
            </div>
            <OriginPostVisual locale={locale} copy={copy.story} />
          </div>
        </section>

        <section className="home-section" id="deploy">
          <div className="site-shell">
            <div data-reveal="up">
              <SectionHead
                kicker={copy.deploy.kicker}
                title={copy.deploy.title}
                description={copy.deploy.description}
              />
            </div>
            <div className="home-deploy" data-reveal="stagger">
              <Link href={`/${locale}/desktop`} className="home-deploy-card home-deploy-mac">
                <span className="home-deploy-top">
                  <span className="home-deploy-eyebrow">{copy.deploy.desktop.eyebrow}</span>
                  <span className="home-deploy-mark" aria-hidden="true">
                    <FaApple focusable="false" />
                  </span>
                </span>
                <strong>{copy.deploy.desktop.title}</strong>
                <p>{copy.deploy.desktop.body}</p>
                <span className="home-deploy-footer">
                  <span className="button button-primary">
                    <FaApple aria-hidden="true" />
                    {copy.deploy.desktop.action}
                  </span>
                  <span className="home-deploy-note">{copy.deploy.desktop.note}</span>
                </span>
              </Link>
              <DeployTabsCard
                copy={copy.deploy.railway}
                templateHref={siteConfig.railway}
                walkthroughHref={`/${locale}/deploy/railway-agent`}
                brandMark={<Railway focusable="false" />}
              />
              <DeployTabsCard
                copy={copy.deploy.zeabur}
                templateHref={siteConfig.zeabur}
                walkthroughHref={`/${locale}/deploy/zeabur-agent`}
                brandMark={<Zeabur focusable="false" />}
              />
              <Link href={`/${locale}/deploy/vercel-agent`} className="home-deploy-card">
                <span className="home-deploy-top">
                  <span className="home-deploy-eyebrow">{copy.deploy.vercel.eyebrow}</span>
                  <span className="home-deploy-mark" aria-hidden="true">
                    <Vercel focusable="false" />
                  </span>
                </span>
                <strong>{copy.deploy.vercel.title}</strong>
                <p>{copy.deploy.vercel.body}</p>
                <span className="home-deploy-footer">
                  <span className="home-card-link">
                    {copy.deploy.vercel.action}
                    <ArrowUpRight aria-hidden="true" strokeWidth={2} />
                  </span>
                </span>
              </Link>
              <div className="home-deploy-card home-deploy-docker">
                <span className="home-deploy-top">
                  <span className="home-deploy-eyebrow">{copy.deploy.docker.eyebrow}</span>
                  <span className="home-deploy-mark" aria-hidden="true">
                    <FaDocker focusable="false" />
                  </span>
                </span>
                <strong>{copy.deploy.docker.title}</strong>
                <p>{copy.deploy.docker.body}</p>
                <div className="home-deploy-footer">
                  <CommandPill
                    command={copy.deploy.docker.command}
                    copyLabel={copy.nav.copy}
                    copiedLabel={copy.nav.copied}
                  />
                  <Link href={`/${locale}/deploy/self-host`} className="home-card-link">
                    {copy.deploy.docker.action}
                    <ArrowRight aria-hidden="true" strokeWidth={2} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <HomeFaq locale={locale} />

        <section className="home-section home-closing">
          <div className="site-shell">
            <div className="home-closing-panel render-deferred" data-reveal="up">
              <h2>{copy.finalCta.title}</h2>
              <p>{copy.finalCta.description}</p>
              <div className="home-hero-actions">
                <a
                  href={siteConfig.railway}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-primary"
                >
                  {copy.finalCta.primary}
                  <ArrowUpRight aria-hidden="true" strokeWidth={2} />
                </a>
                <a
                  href={siteConfig.github}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-secondary"
                >
                  <FaGithub aria-hidden="true" />
                  {copy.finalCta.secondary}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} copy={copy.footer} />
    </>
  );
}
