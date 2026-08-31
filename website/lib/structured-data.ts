import type { Dictionary, Locale, TokenGuideCopy } from "@/lib/i18n";
import { locales } from "@/lib/locales";
import { siteConfig } from "@/lib/site";

// Dictionary titles end with "… | Threads Analytics"; schema names should
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
        alternateName: "Threads Analytics Dashboard",
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

/** Home → current page trail for subpages (deploy guides, token guide). */
export function getBreadcrumbStructuredData({
  locale,
  path,
  title,
}: {
  locale: Locale;
  /** Route path after the locale segment, e.g. "/token-guide". */
  path: string;
  /** Page title; a trailing "| Threads Analytics" is stripped. */
  title: string;
}) {
  const localizedUrl = `${siteConfig.url}/${locale}`;

  return {
    "@type": "BreadcrumbList",
    "@id": `${localizedUrl}${path}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: siteConfig.name,
        item: localizedUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: stripBrandSuffix(title),
        item: `${localizedUrl}${path}`,
      },
    ],
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
