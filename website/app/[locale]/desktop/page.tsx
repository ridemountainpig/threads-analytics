import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Check,
  ChevronRight,
  Database,
  Download,
  KeyRound,
  LockKeyhole,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
} from "lucide-react";
import { DesktopDownloadLink, DesktopDownloadNotice } from "@/components/desktop-download";
import { JsonLd } from "@/components/json-ld";
import { SectionHead } from "@/components/section-head";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ViewportRevealController } from "@/components/viewport-reveal-controller";
import { getDesktopRelease } from "@/lib/desktop-release";
import { getDictionary, isLocale, locales, type DesktopPerkIcon, type Locale } from "@/lib/i18n";
import { localizedPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { getDesktopPageStructuredData } from "@/lib/structured-data";

// Release assets are named by the release workflow
// (.github/workflows/release-desktop.yml); the version varies per release.
// Shown only when the latest release couldn't be looked up.
const assetName = "Threads-Analytics-x.y.z-macos-arm64.zip";

// desktop/docs ships one install guide per locale.
const installGuideFile: Record<Locale, string> = {
  en: "install-macos.md",
  "zh-TW": "install-macos-zh.md",
  ja: "install-macos-ja.md",
};

// The desktop build with demo data, captured at a MacBook's 1512×982
// viewport so it fills the screen in the device frame.
const screenshot = {
  light: "/media/mac-app-light.webp",
  dark: "/media/mac-app-dark.webp",
  width: 3024,
  height: 1964,
};

const appIcon = "/media/threads-analytics-icon.png";

const perkIcons: Record<DesktopPerkIcon, ReactNode> = {
  database: <Database strokeWidth={1.8} />,
  lock: <LockKeyhole strokeWidth={1.8} />,
  sync: <RefreshCw strokeWidth={1.8} />,
  bell: <BellRing strokeWidth={1.8} />,
};

// Renders the dictionary's `**…**` markers (UI labels like button names) as
// bold without pulling in a markdown renderer.
function emphasize(text: string) {
  return text
    .split(/\*\*(.+?)\*\*/g)
    .map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

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
  const copy = getDictionary(locale).desktopGuide;

  return localizedPageMetadata({
    locale,
    path: "/desktop",
    title: copy.metadata.title,
    description: copy.metadata.description,
    ogImageSet: "desktop",
  });
}

export default async function DesktopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const copy = dictionary.desktopGuide;

  const release = await getDesktopRelease();
  const download = release
    ? { href: release.downloadUrl, version: release.version }
    : { href: siteConfig.desktopReleases };
  const fileSize = release
    ? new Intl.NumberFormat(locale, {
        style: "unit",
        unit: "megabyte",
        maximumFractionDigits: 0,
      }).format(release.bytes / 1e6)
    : null;

  return (
    <>
      <JsonLd
        data={getDesktopPageStructuredData({
          locale,
          copy,
          image: screenshot.light,
          version: release?.version,
        })}
      />
      <ViewportRevealController />
      <SiteHeader locale={locale} copy={dictionary.nav} productBar />
      <main className="mac-page">
        <nav className="mac-localnav" aria-label={copy.localNav.label}>
          <div className="site-shell mac-localnav-inner">
            <a href="#overview" className="mac-localnav-title">
              {copy.localNav.title}
            </a>
            <div className="mac-localnav-links">
              <a href="#overview">{copy.localNav.overview}</a>
              <a href="#compare">{copy.localNav.compare}</a>
              <a href="#install">{copy.localNav.install}</a>
              <a href="#faq">{copy.localNav.faq}</a>
            </div>
            <DesktopDownloadLink {...download} className="mac-localnav-cta">
              {copy.localNav.download}
            </DesktopDownloadLink>
          </div>
        </nav>

        <section className="mac-hero" id="overview" aria-labelledby="mac-hero-title">
          <div className="site-shell mac-hero-copy">
            <Image
              src={appIcon}
              alt=""
              width={112}
              height={112}
              className="mac-hero-icon"
              fetchPriority="high"
            />
            <p className="mac-hero-kicker">{copy.hero.kicker}</p>
            <h1 className="mac-hero-title" id="mac-hero-title">
              <span>{copy.hero.lineOne}</span>
              <span>{copy.hero.lineTwo}</span>
            </h1>
            <p className="mac-hero-lead">{copy.hero.description}</p>
            <div className="mac-hero-actions">
              <DesktopDownloadLink {...download} className="button button-primary">
                {copy.hero.primaryCta}
                <Download aria-hidden="true" strokeWidth={2} />
              </DesktopDownloadLink>
              <a href="#install" className="mac-text-link">
                {copy.hero.secondaryCta}
                <ChevronRight aria-hidden="true" strokeWidth={2} />
              </a>
            </div>
            <p className="mac-hero-note">{copy.hero.note}</p>
          </div>
          {/* Both shots load lazily so only the visible theme's is fetched;
              fetchPriority still makes it the page's first image request. */}
          <div className="site-shell">
            <div className="mac-device" data-reveal="scale">
              <div className="mac-device-lid">
                <div className="mac-device-screen">
                  <Image
                    src={screenshot.light}
                    alt={copy.hero.imageAlt}
                    width={screenshot.width}
                    height={screenshot.height}
                    sizes="(max-width: 1200px) 88vw, 1040px"
                    fetchPriority="high"
                    className="mac-shot mac-shot-light"
                  />
                  <Image
                    src={screenshot.dark}
                    alt={copy.hero.imageAlt}
                    width={screenshot.width}
                    height={screenshot.height}
                    sizes="(max-width: 1200px) 88vw, 1040px"
                    fetchPriority="high"
                    className="mac-shot mac-shot-dark"
                  />
                </div>
              </div>
              <div className="mac-device-base" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="mac-section" aria-labelledby="mac-highlights-title">
          <div className="site-shell">
            <div data-reveal="up">
              <SectionHead
                kicker={copy.highlights.kicker}
                title={copy.highlights.title}
                description={copy.highlights.description}
                id="mac-highlights-title"
              />
            </div>
            <ul className="mac-tiles" data-reveal="stagger">
              {copy.highlights.perks.map((perk) => (
                <li className="mac-tile" key={perk.icon}>
                  <span className="mac-tile-icon" aria-hidden="true">
                    {perkIcons[perk.icon]}
                  </span>
                  <h3>{perk.title}</h3>
                  <p>{perk.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="mac-section mac-section-sunken"
          id="compare"
          aria-labelledby="mac-compare-title"
        >
          <div className="site-shell">
            <div data-reveal="up">
              <SectionHead
                kicker={copy.compare.kicker}
                title={copy.compare.title}
                description={copy.compare.description}
                id="mac-compare-title"
              />
            </div>
            <div className="mac-compare" data-reveal="up" data-reveal-delay="1">
              {/* A three-column table read aloud; visually each aspect sits
                  above its pair of values, as on Apple's compare pages. */}
              <table>
                <thead>
                  <tr>
                    <td />
                    <th scope="col">
                      <Image src={appIcon} alt="" width={64} height={64} />
                      {copy.compare.desktopLabel}
                    </th>
                    <th scope="col">
                      <span className="mac-compare-server" aria-hidden="true">
                        <Server strokeWidth={1.6} />
                      </span>
                      {copy.compare.webLabel}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {copy.compare.rows.map((row) => (
                    <tr key={row.aspect}>
                      <th scope="row">{row.aspect}</th>
                      <td>{row.desktop}</td>
                      <td>{row.web}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mac-compare-actions">
                <DesktopDownloadLink {...download} className="button button-primary">
                  {copy.localNav.download}
                  <Download aria-hidden="true" strokeWidth={2} />
                </DesktopDownloadLink>
                <Link href={`/${locale}#deploy`} className="mac-text-link">
                  {copy.compare.noteCta}
                  <ChevronRight aria-hidden="true" strokeWidth={2} />
                </Link>
              </div>
            </div>
            <p className="mac-footnote" data-reveal="fade">
              {copy.compare.note}
            </p>
          </div>
        </section>

        <section className="mac-section" id="install" aria-labelledby="mac-install-title">
          <div className="site-shell">
            <div data-reveal="up">
              <SectionHead
                kicker={copy.install.kicker}
                title={copy.install.title}
                description={copy.install.description}
                id="mac-install-title"
              />
            </div>
            <ol className="mac-steps" data-reveal="stagger">
              {copy.install.steps.map((step) => (
                <li className="mac-step" key={step.index}>
                  <span className="mac-step-num" aria-hidden="true">
                    {Number(step.index)}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{emphasize(step.body)}</p>
                </li>
              ))}
            </ol>
            <div className="mac-install-grid" data-reveal="up">
              <div className="mac-panel">
                <h3>{copy.install.setupTitle}</h3>
                <p className="mac-panel-lead">{copy.install.setupDescription}</p>
                <ol className="mac-setup-list">
                  {copy.install.setupSteps.map((step) => (
                    <li key={step.index}>
                      <strong>{step.title}</strong>
                      <span>{emphasize(step.body)}</span>
                    </li>
                  ))}
                </ol>
                <p className="mac-panel-foot">
                  <KeyRound aria-hidden="true" strokeWidth={1.8} />
                  <span>
                    {copy.install.tokenNote}{" "}
                    <Link href={`/${locale}/token-guide`} className="mac-text-link">
                      {copy.install.tokenCta}
                      <ChevronRight aria-hidden="true" strokeWidth={2} />
                    </Link>
                  </span>
                </p>
              </div>
              <div className="mac-panel">
                <h3>{copy.install.requirementsTitle}</h3>
                <ul className="mac-spec-list">
                  {copy.install.requirements.map((item) => (
                    <li key={item}>
                      <Check aria-hidden="true" strokeWidth={2.2} />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mac-spec-file">
                  {release ? (
                    <>
                      <span>
                        {copy.install.latestLabel} · {release.version} · {fileSize}
                      </span>
                      <code>{release.fileName}</code>
                      <a
                        href={release.releaseUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mac-text-link"
                      >
                        {copy.install.releaseNotes}
                        <ArrowUpRight aria-hidden="true" strokeWidth={2} />
                      </a>
                    </>
                  ) : (
                    <>
                      <span>{copy.install.assetLabel}</span>
                      <code>{assetName}</code>
                    </>
                  )}
                </div>
                <p className="mac-panel-foot">
                  <ShieldCheck aria-hidden="true" strokeWidth={1.8} />
                  <span>
                    {copy.install.hint} {copy.install.intelNote}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mac-section" id="faq" aria-labelledby="mac-faq-title">
          <div className="site-shell">
            <div data-reveal="up">
              <SectionHead kicker={copy.faq.kicker} title={copy.faq.title} id="mac-faq-title" />
            </div>
            <div className="mac-faq-list" data-reveal="fade">
              {copy.faq.items.map((item) => (
                <details className="mac-faq-item" key={item.question}>
                  <summary>
                    {item.question}
                    <Plus aria-hidden="true" strokeWidth={1.8} />
                  </summary>
                  <div className="mac-faq-answer">
                    <p>{emphasize(item.answer)}</p>
                    {item.extra === "folder" ? <code>{siteConfig.desktopDataFolder}</code> : null}
                    {item.extra === "issues" ? (
                      <a
                        href={`${siteConfig.github}/issues`}
                        target="_blank"
                        rel="noreferrer"
                        className="mac-text-link"
                      >
                        {copy.faq.issuesCta}
                        <ArrowUpRight aria-hidden="true" strokeWidth={2} />
                      </a>
                    ) : null}
                  </div>
                </details>
              ))}
            </div>
            <a
              href={`${siteConfig.github}/blob/main/desktop/docs/${installGuideFile[locale]}`}
              target="_blank"
              rel="noreferrer"
              className="mac-text-link mac-faq-guide"
              data-reveal="fade"
            >
              {copy.faq.guideCta}
              <ArrowUpRight aria-hidden="true" strokeWidth={2} />
            </a>
          </div>
        </section>

        <section className="mac-closing" aria-labelledby="mac-closing-title">
          <div className="site-shell mac-closing-inner" data-reveal="up">
            <Image src={appIcon} alt="" width={96} height={96} className="mac-closing-icon" />
            <h2 id="mac-closing-title">{copy.cta.title}</h2>
            <p className="mac-closing-lead">{copy.cta.description}</p>
            <div className="mac-hero-actions">
              <DesktopDownloadLink {...download} className="button button-primary">
                {copy.cta.primary}
                <Download aria-hidden="true" strokeWidth={2} />
              </DesktopDownloadLink>
              <Link href={`/${locale}#deploy`} className="button button-secondary">
                {copy.cta.secondary}
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </Link>
            </div>
            <p className="mac-hero-note">{copy.cta.note}</p>
          </div>
        </section>
        <DesktopDownloadNotice copy={copy.downloadNotice} starHref={siteConfig.github} />
      </main>
      <SiteFooter locale={locale} copy={dictionary.footer} />
    </>
  );
}
