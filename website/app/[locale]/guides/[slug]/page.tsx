import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { ClosingCurves } from "@/components/closing-curves";
import { GuideLinks } from "@/components/guide-links";
import { GuideSources } from "@/components/guide-sources";
import { JsonLd } from "@/components/json-ld";
import { mdxArticleComponents } from "@/components/mdx-article";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ViewportRevealController } from "@/components/viewport-reveal-controller";
import { loadGuideBody } from "@/lib/content";
import {
  getGuide,
  guideAuthor,
  guideMeta,
  guideSlugs,
  guideUi,
  isGuideSlug,
  type GuideSlug,
} from "@/lib/guides";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { localizedPageMetadata } from "@/lib/metadata";
import { getGuideStructuredData } from "@/lib/structured-data";

export function generateStaticParams() {
  return locales.flatMap((locale) => guideSlugs.map((slug) => ({ locale, slug })));
}

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isGuideSlug(slug)) notFound();
  const copy = getGuide(slug, locale);
  const meta = guideMeta[slug];

  return localizedPageMetadata({
    locale,
    path: `/guides/${slug}`,
    title: copy.metadata.title,
    description: copy.metadata.description,
    ogImageSet: `guide-${slug}`,
    article: {
      publishedTime: meta.published,
      modifiedTime: meta.modified,
      authors: [guideAuthor.url],
    },
  });
}

export default async function GuidePage({ params }: { params: Params }) {
  const { locale: rawLocale, slug: rawSlug } = await params;
  if (!isLocale(rawLocale) || !isGuideSlug(rawSlug)) notFound();
  const locale: Locale = rawLocale;
  const slug: GuideSlug = rawSlug;
  const dictionary = getDictionary(locale);
  const copy = getGuide(slug, locale);
  const ui = guideUi[locale];
  const meta = guideMeta[slug];
  const { default: Body } = await loadGuideBody(slug, locale);
  // Kickers read "Section / Topic"; the section links back to the hub.
  const [kickerSection, ...kickerTopic] = copy.hero.kicker.split(" / ");

  return (
    <>
      <JsonLd
        data={getGuideStructuredData({
          locale,
          slug,
          copy,
          datePublished: meta.published,
          dateModified: meta.modified,
        })}
      />
      <ViewportRevealController />
      <SiteHeader locale={locale} copy={dictionary.nav} />
      <main>
        <article className="article">
          <header className="article-header">
            <p className="article-category">
              <Link href={`/${locale}/guides`}>{kickerSection}</Link>
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
                  <time dateTime={meta.modified}>
                    {ui.updatedLabel} {meta.modified}
                  </time>
                  <span aria-hidden="true"> · </span>
                  {copy.hero.readingTime}
                </p>
              </div>
            </div>
          </header>

          <div className="article-body">
            <Body components={mdxArticleComponents(locale)} />

            <section className="article-faq" aria-labelledby="article-faq-title">
              <h2 id="article-faq-title">{copy.faq.title}</h2>
              {copy.faq.items.map((item) => (
                <details key={item.question}>
                  <summary>
                    {item.question}
                    <ChevronDown aria-hidden="true" strokeWidth={2} />
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </section>

            <GuideSources locale={locale} includeAnnouncement={meta.citesMetaAnnouncement} />
          </div>
        </article>

        <GuideLinks locale={locale} exclude={slug} />

        <section className="agent-cta-section">
          <div className="site-shell" data-reveal="up">
            <div className="agent-cta guide-finish">
              <ClosingCurves />
              <div className="agent-cta-inner">
                <h2>{copy.cta.title}</h2>
                <p>{copy.cta.description}</p>
                <div className="hero-actions">
                  <Link href={`/${locale}${copy.cta.primaryHref}`} className="button button-light">
                    {copy.cta.primary}
                    <ArrowRight aria-hidden="true" strokeWidth={2} />
                  </Link>
                  <Link href={`/${locale}/analytics`} className="button button-ghost">
                    {copy.cta.secondary}
                    <ArrowUpRight aria-hidden="true" strokeWidth={2} />
                  </Link>
                </div>
                <p className="guide-finish-expiry">
                  <FaGithub aria-hidden="true" />
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
