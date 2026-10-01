import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import type { ReactNode } from "react";
import { ClosingCurves } from "@/components/closing-curves";
import { GuideLinks } from "@/components/guide-links";
import { GuideSources } from "@/components/guide-sources";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ViewportRevealController } from "@/components/viewport-reveal-controller";
import {
  getGuide,
  guideAuthor,
  guideImages,
  guideMeta,
  guideSlugs,
  guideUi,
  isGuideSlug,
  type GuideBlock,
  type GuideSlug,
} from "@/lib/guides";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { localizedPageMetadata } from "@/lib/metadata";
import { getGuideStructuredData } from "@/lib/structured-data";

export const dynamicParams = false;

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

// Renders the two inline marks the guide copy uses: **bold** and
// [label](href). Hrefs starting with "/" are locale-relative.
function renderInline(text: string, locale: Locale): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={i}>{bold[1]}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      return href.startsWith("/") ? (
        <Link key={i} href={`/${locale}${href}`}>
          {label}
        </Link>
      ) : (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    }
    return part;
  });
}

function ArticleBlock({ block, locale }: { block: GuideBlock; locale: Locale }) {
  switch (block.type) {
    case "p":
      return <p>{renderInline(block.text, locale)}</p>;
    case "h2":
      return <h2>{block.text}</h2>;
    case "h3":
      return <h3>{block.text}</h3>;
    case "ul":
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item}>{renderInline(item, locale)}</li>
          ))}
        </ul>
      );
    case "callout":
      return <aside className="article-callout">{renderInline(block.text, locale)}</aside>;
    case "table":
      return (
        <figure className="article-table">
          <div className="article-table-scroll">
            <table>
              <thead>
                <tr>
                  {block.head.map((cell, i) => (
                    <th key={i} scope="col">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row.join("|")}>
                    {row.map((cell, i) =>
                      i === 0 ? (
                        <th key={i} scope="row">
                          {cell}
                        </th>
                      ) : (
                        <td key={i}>{cell}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <figcaption>{block.caption}</figcaption>
        </figure>
      );
    case "figure": {
      const image = guideImages[block.image];
      return (
        <figure className="article-figure">
          <Image
            src={image.src}
            width={image.width}
            height={image.height}
            alt={block.alt}
            sizes="(max-width: 780px) 100vw, 760px"
          />
          <figcaption>{block.caption}</figcaption>
        </figure>
      );
    }
  }
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
            {copy.body.map((block, index) => (
              <ArticleBlock key={index} block={block} locale={locale} />
            ))}

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
