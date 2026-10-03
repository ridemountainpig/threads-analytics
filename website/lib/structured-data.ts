import {
  getGuide,
  guideAuthor,
  guideHub,
  guideSlugs,
  type GuideCopy,
  type GuideSlug,
} from "@/lib/guides";
import type { Dictionary, Locale, TokenGuideCopy } from "@/lib/i18n";
import { locales } from "@/lib/locales";
import { siteConfig } from "@/lib/site";

// Home titles may end with "… | Threads Analytics"; schema names should
// carry just the page name.
function stripBrandSuffix(title: string) {
  return title.split(" | ")[0];
}

// Dictionary copy marks UI labels as `**label**`; schema text is plain.
function stripEmphasis(text: string) {
  return text.replace(/\*\*/g, "");
}

export function getStructuredData(locale: Locale, copy: Dictionary) {
  const localizedUrl = `${siteConfig.url}/${locale}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        alternateName: [
          "Threads Analytics Dashboard",
          "Threads 數據分析工具",
          "Threads 分析工具",
          "Threads 分析ツール",
        ],
        inLanguage: [...locales],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${localizedUrl}#software-application`,
        url: localizedUrl,
        name: siteConfig.name,
        description: copy.metadata.description,
        image: `${siteConfig.url}/media/dashboard.png`,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Social media analytics",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        license: "https://www.gnu.org/licenses/agpl-3.0.html",
        inLanguage: locale,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: {
          "@type": "Person",
          name: "Yen Cheng",
          url: siteConfig.creator,
        },
        sameAs: siteConfig.github,
      },
    ],
  };
}

/** Home → (optional parent) → current page trail for subpages. */
export function getBreadcrumbStructuredData({
  locale,
  path,
  title,
  parent,
}: {
  locale: Locale;
  /** Route path after the locale segment, e.g. "/token-guide". */
  path: string;
  /** Page title; a trailing "| Threads Analytics" is stripped. */
  title: string;
  /** Section page between home and this one, e.g. the guides hub. */
  parent?: { path: string; name: string };
}) {
  const localizedUrl = `${siteConfig.url}/${locale}`;
  const trail = [
    { name: siteConfig.name, item: localizedUrl },
    ...(parent ? [{ name: parent.name, item: `${localizedUrl}${parent.path}` }] : []),
    { name: stripBrandSuffix(title), item: `${localizedUrl}${path}` },
  ];

  return {
    "@type": "BreadcrumbList",
    "@id": `${localizedUrl}${path}#breadcrumb`,
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      ...crumb,
    })),
  };
}

export function getDeployPageStructuredData({
  locale,
  path,
  title,
}: {
  locale: Locale;
  path: string;
  title: string;
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [getBreadcrumbStructuredData({ locale, path, title })],
  };
}

/**
 * The desktop page describes a downloadable build, so on top of the
 * breadcrumb it carries its own SoftwareApplication entry with the platform
 * requirements from desktop/docs/install-macos.md.
 */
export function getDesktopPageStructuredData({
  locale,
  title,
  description,
}: {
  locale: Locale;
  title: string;
  description: string;
}) {
  const path = "/desktop";
  const pageUrl = `${siteConfig.url}/${locale}${path}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      getBreadcrumbStructuredData({ locale, path, title }),
      {
        "@type": "SoftwareApplication",
        "@id": `${pageUrl}#software-application`,
        url: pageUrl,
        name: `${siteConfig.name} for Mac`,
        description,
        image: `${siteConfig.url}/media/dashboard.png`,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Social media analytics",
        operatingSystem: "macOS 11 or later",
        processorRequirements: "Apple silicon (arm64)",
        downloadUrl: siteConfig.desktopReleases,
        isAccessibleForFree: true,
        license: "https://www.gnu.org/licenses/agpl-3.0.html",
        inLanguage: locale,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: {
          "@type": "Person",
          name: "Yen Cheng",
          url: siteConfig.creator,
        },
        sameAs: siteConfig.github,
      },
    ],
  };
}

/**
 * HowTo markup for the token guide. Google retired HowTo rich results, but
 * the markup still helps search and AI crawlers understand the page as a
 * step-by-step procedure. Step anchors mirror the page's `#step-N` ids.
 */
export function getTokenGuideStructuredData(locale: Locale, copy: TokenGuideCopy) {
  const path = "/token-guide";
  const pageUrl = `${siteConfig.url}/${locale}${path}`;
  const steps = copy.phases.flatMap((phase) => phase.steps);

  return {
    "@context": "https://schema.org",
    "@graph": [
      getBreadcrumbStructuredData({ locale, path, title: copy.metadata.title }),
      {
        "@type": "HowTo",
        "@id": `${pageUrl}#howto`,
        name: stripBrandSuffix(copy.metadata.title),
        description: copy.metadata.description,
        inLanguage: locale,
        totalTime: "PT10M",
        step: steps.map((step, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: stripEmphasis(step.title),
          text: stripEmphasis(
            [step.body, ...(step.bullets ?? []), step.note].filter(Boolean).join(" "),
          ),
          url: `${pageUrl}#step-${i + 1}`,
        })),
      },
    ],
  };
}

/**
 * Article + FAQPage for the long-form guides. FAQPage rich results are
 * limited to authoritative sites, but the markup still lets search and AI
 * crawlers lift the question/answer pairs directly.
 */
export function getGuideStructuredData({
  locale,
  slug,
  copy,
  datePublished,
  dateModified,
}: {
  locale: Locale;
  slug: GuideSlug;
  copy: GuideCopy;
  datePublished: string;
  dateModified: string;
}) {
  const path = `/guides/${slug}`;
  const pageUrl = `${siteConfig.url}/${locale}${path}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      getBreadcrumbStructuredData({
        locale,
        path,
        title: copy.metadata.title,
        parent: { path: "/guides", name: guideHub[locale].label },
      }),
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        headline: stripBrandSuffix(copy.metadata.title),
        description: copy.metadata.description,
        inLanguage: locale,
        datePublished,
        dateModified,
        image: `${siteConfig.url}/og/guide-${slug}-${locale}.png`,
        mainEntityOfPage: pageUrl,
        author: {
          "@type": "Person",
          name: guideAuthor.name,
          url: guideAuthor.url,
        },
        publisher: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        inLanguage: locale,
        mainEntity: copy.faq.items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };
}

/** Breadcrumb + CollectionPage listing every guide, for the /guides hub. */
export function getGuideHubStructuredData(locale: Locale) {
  const path = "/guides";
  const localizedUrl = `${siteConfig.url}/${locale}`;
  const hub = guideHub[locale];

  return {
    "@context": "https://schema.org",
    "@graph": [
      getBreadcrumbStructuredData({ locale, path, title: hub.label }),
      {
        "@type": "CollectionPage",
        "@id": `${localizedUrl}${path}#collection`,
        url: `${localizedUrl}${path}`,
        name: hub.metadata.title,
        description: hub.metadata.description,
        inLanguage: locale,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: guideSlugs.map((slug, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${localizedUrl}/guides/${slug}`,
            name: getGuide(slug, locale).metadata.title,
          })),
        },
      },
    ],
  };
}
