import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { AgentCtaOthers } from "@/components/agent-cta-others";
import { AgentDeployDemo } from "@/components/agent-deploy-demo";
import { AgentHeroActions } from "@/components/agent-hero-actions";
import { AgentKicker } from "@/components/agent-kicker";
import { AgentPromptCard } from "@/components/agent-prompt-card";
import { ClosingCurves } from "@/components/closing-curves";
import { Zeabur } from "@/components/deployment-logos";
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
  const copy = getDictionary(locale).zeaburAgentDeploy;

  return localizedPageMetadata({
    locale,
    path: "/deploy/zeabur-agent",
    title: copy.metadata.title,
    description: copy.metadata.description,
    ogImageSet: "zeabur-agent",
  });
}

export default async function ZeaburAgentDeployPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const copy = dictionary.zeaburAgentDeploy;

  return (
    <>
      <JsonLd
        data={getDeployPageStructuredData({
          locale,
          path: "/deploy/zeabur-agent",
          title: copy.metadata.title,
        })}
      />
      <ViewportRevealController />
      <SiteHeader locale={locale} copy={dictionary.nav} />
      <main>
        <section className="agent-hero-section">
          <div className="hero-grid-bg" aria-hidden="true" />
          <HeroCurve />
          <div className="site-shell agent-hero-grid">
            <div className="agent-hero-copy">
              <AgentKicker
                locale={locale}
                label={copy.hero.kicker}
                brandmark={
                  <span
                    className="agent-hero-brandmark agent-hero-brandmark-zeabur"
                    aria-hidden="true"
                  >
                    <Zeabur focusable="false" />
                  </span>
                }
              />
              <h1>
                <span>{copy.hero.lineOne}</span>
                <em>{copy.hero.lineTwo}</em>
              </h1>
              <p className="hero-description">{copy.hero.description}</p>
              <AgentHeroActions
                copy={copy.hero}
                promptText={copy.prompt.text}
                openHref={siteConfig.zeaburAgent}
              />
              <p className="hero-note">{copy.hero.note}</p>
            </div>
            <div className="agent-hero-side">
              <AgentPromptCard
                label={copy.prompt.label}
                text={copy.prompt.text}
                copyLabel={copy.prompt.copy}
                copiedLabel={copy.prompt.copied}
                hint={copy.prompt.hint}
                send={{
                  href: siteConfig.zeaburAgent,
                  label: copy.prompt.send,
                  domain: "zeabur.com",
                }}
              />
            </div>
          </div>
        </section>

        <section className="agent-steps-section">
          <div className="site-shell">
            <div data-reveal="up">
              <div className="section-heading">
                <p className="section-kicker">{copy.steps.kicker}</p>
                <h2>{copy.steps.title}</h2>
                <p className="section-description">{copy.steps.description}</p>
              </div>
            </div>
            <div className="agent-steps-grid" data-reveal="stagger" data-reveal-delay="1">
              {copy.steps.items.map((item) => (
                <div key={item.index} className="agent-step-card">
                  <span className="agent-step-index">{item.index}</span>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="agent-demo-section">
          <div className="site-shell">
            <div data-reveal="up">
              <div className="section-heading section-heading-inverse">
                <p className="section-kicker">{copy.demo.kicker}</p>
                <h2>{copy.demo.title}</h2>
                <p className="section-description">{copy.demo.description}</p>
              </div>
            </div>
            <div className="render-deferred" data-reveal="scale" data-reveal-delay="1">
              <AgentDeployDemo copy={copy.demo} promptText={copy.prompt.text} />
            </div>
          </div>
        </section>

        <section className="agent-cta-section">
          <div className="site-shell" data-reveal="up">
            <div className="agent-cta">
              <ClosingCurves />
              <div className="agent-cta-inner">
                <h2>{copy.cta.title}</h2>
                <p>{copy.cta.description}</p>
                <div className="hero-actions">
                  <a
                    href={siteConfig.zeaburAgent}
                    target="_blank"
                    rel="noreferrer"
                    className="button button-light"
                  >
                    {copy.cta.primary}
                    <ArrowUpRight aria-hidden="true" strokeWidth={2} />
                  </a>
                  <Link href={`/${locale}#deploy`} className="button button-ghost">
                    <ArrowLeft aria-hidden="true" strokeWidth={2} />
                    {copy.cta.secondary}
                  </Link>
                </div>
                <AgentCtaOthers locale={locale} label={copy.cta.others} current="zeabur-agent" />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} copy={dictionary.footer} />
    </>
  );
}
