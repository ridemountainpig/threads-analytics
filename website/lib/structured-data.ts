import type { Dictionary, Locale } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";

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
        inLanguage: ["en", "zh-TW", "ja"],
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
