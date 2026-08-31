import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, locales } from "@/lib/i18n";
import { localizedPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import "@/app/globals.css";

export const dynamicParams = false;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f5f1",
  colorScheme: "light",
};

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
  const copy = getDictionary(locale);

  // OG images are pre-rendered by scripts/og/generate-og-images.tsx
  // (`pnpm og:generate`) instead of an opengraph-image route: request-time
  // rendering depends on the host's sharp build, which broke SVG
  // rasterization in production.
  return {
    metadataBase: new URL(siteConfig.url),
    applicationName: siteConfig.name,
    ...localizedPageMetadata({
      locale,
      path: "",
      title: copy.metadata.title,
      description: copy.metadata.description,
    }),
  };
}

// Runs before first paint so reveal targets start hidden instead of
// flashing visible until React hydrates. Mirrors the guards in
// ViewportRevealController: no-JS and reduced-motion visitors never get
// the class, so content stays visible for them.
const revealBootstrap =
  "try{if('IntersectionObserver'in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('js-reveal')}catch(e){}";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        {/* Wrapped in innerHTML so React never renders a script element
            (avoids the React 19 warning on client navigations). The browser
            parser executes it before first paint on full page loads; on
            client navigations it stays inert and ViewportRevealController
            re-asserts the class instead. */}
        <div hidden dangerouslySetInnerHTML={{ __html: `<script>${revealBootstrap}</script>` }} />
        {children}
      </body>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  );
}
