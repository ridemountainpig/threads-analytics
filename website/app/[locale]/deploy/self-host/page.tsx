import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AgentCtaOthers } from "@/components/agent-cta-others";
import { ClosingCurves } from "@/components/closing-curves";
import { JsonLd } from "@/components/json-ld";
import { mdxArticleComponents } from "@/components/mdx-article";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ViewportRevealController } from "@/components/viewport-reveal-controller";
import { loadSelfHostBody } from "@/lib/content";
import { guideAuthor } from "@/lib/guides";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { localizedPageMetadata } from "@/lib/metadata";
import { selfHost, selfHostMeta } from "@/lib/self-host";
import { siteConfig } from "@/lib/site";
import { getSelfHostStructuredData } from "@/lib/structured-data";

const path = "/deploy/self-host";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = selfHost[locale];

  return localizedPageMetadata({
    locale,
    path,
    title: copy.metadata.title,
    description: copy.metadata.description,
    ogImageSet: "self-host",
    article: {
      publishedTime: selfHostMeta.published,
      modifiedTime: selfHostMeta.modified,
      authors: [guideAuthor.url],
    },
  });
}

export default async function SelfHostPage({ params }: { params: Params }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const copy = selfHost[locale];
  const { default: Body, headings } = await loadSelfHostBody(locale);
  // Kickers read "Section / Topic"; the section links to the deploy options.
  const [kickerSection, ...kickerTopic] = copy.hero.kicker.split(" / ");

  return (
    <>
      <JsonLd data={getSelfHostStructuredData(locale)} />
      <ViewportRevealController />
      <SiteHeader locale={locale} copy={dictionary.nav} />
      <main>
        <article className="article">
          <header className="article-header">
            <p className="article-category">
              <Link href={`/${locale}#deploy`}>{kickerSection}</Link>
              {kickerTopic.length > 0 && <> / {kickerTopic.join(" / ")}</>}
            </p>
            <h1>
              <span>{copy.hero.lineOne}</span> <span>{copy.hero.lineTwo}</span>
            </h1>
            <p className="article-dek">{copy.hero.description}</p>
            <div className="article-byline">
              <span className="article-avatar" aria-hidden="true">
                {guideAuthor.initials}
              </span>
              <div>
                <a href={guideAuthor.url} target="_blank" rel="noopener noreferrer">
                  {guideAuthor.name}
                </a>
                <p>
                  <time dateTime={selfHostMeta.modified}>
                    {copy.updatedLabel} {selfHostMeta.modified}
                  </time>
                </p>
              </div>
            </div>
          </header>

          <nav className="article-toc" aria-labelledby="article-toc-title">
            <p id="article-toc-title">{copy.tocTitle}</p>
            <ol>
              {headings
                .filter((heading) => heading.depth === 2)
                .map((heading) => (
                  <li key={heading.id}>
                    <a href={`#${heading.id}`}>{heading.text}</a>
                  </li>
                ))}
            </ol>
          </nav>

          <div className="article-body">
            <Body components={mdxArticleComponents(locale)} />
          </div>
        </article>

        <section className="agent-cta-section">
          <div className="site-shell" data-reveal="up">
            <div className="agent-cta">
              <ClosingCurves />
              <div className="agent-cta-inner">
                <h2>{copy.cta.title}</h2>
                <p>{copy.cta.description}</p>
                <div className="hero-actions">
                  <Link href={`/${locale}/token-guide`} className="button button-light">
                    {copy.cta.primary}
                    <ArrowRight aria-hidden="true" strokeWidth={2} />
                  </Link>
                  <a
                    href={siteConfig.github}
                    target="_blank"
                    rel="noreferrer"
                    className="button button-ghost"
                  >
                    {copy.cta.secondary}
                    <ArrowUpRight aria-hidden="true" strokeWidth={2} />
                  </a>
                </div>
                <AgentCtaOthers locale={locale} label={copy.cta.others} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} copy={dictionary.footer} />
    </>
  );
}
