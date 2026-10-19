import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { ThemeController } from "@/components/theme-menu";
import { getDictionary, isLocale, locales } from "@/lib/i18n";
import { localizedPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { themeBootstrap, themeColors } from "@/lib/theme";
import "@/app/globals.css";

// Self-hosted so every platform renders the same face --sans declares; CJK
// glyphs fall through to each locale's system family (app/styles/tokens.css).
const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

// The header's GitHub star count (lib/github-stars.ts) refreshes daily; set
// here too so a build that couldn't reach GitHub still retries the next day.
export const revalidate = 86400;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // An explicit light/dark pick overrides these at runtime (ThemeController).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: themeColors.light },
    { media: "(prefers-color-scheme: dark)", color: themeColors.dark },
  ],
  colorScheme: "light dark",
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

// .render-deferred sections sit at a placeholder height until they render,
// so a jump to #deploy lands ~700px low and then snaps up. Before any hash
// jump (a #link on load, or a click on one), lay them all out at full size.
const anchorBootstrap =
  "try{var r=function(){document.documentElement.classList.add('render-all')};if(location.hash)r();document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href*=\"#\"]');if(a&&a.hash)r()},true)}catch(e){}";

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
    <html
      lang={locale}
      className={`${geist.variable} ${geistMono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        {/* Wrapped in innerHTML so React never renders a script element
            (avoids the React 19 warning on client navigations). The browser
            parser executes it before first paint on full page loads; on
            client navigations it stays inert and ViewportRevealController
            re-asserts the class instead. */}
        <div
          hidden
          dangerouslySetInnerHTML={{
            __html: `<script>${themeBootstrap}${revealBootstrap}${anchorBootstrap}</script>`,
          }}
        />
        <ThemeController />
        {children}
      </body>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  );
}
