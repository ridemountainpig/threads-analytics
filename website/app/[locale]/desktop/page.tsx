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
  Database,
  Download,
  Info,
  KeyRound,
  Laptop,
  LockKeyhole,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { ClosingCurves } from "@/components/closing-curves";
import { HeroCurve } from "@/components/hero-curve";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ViewportRevealController } from "@/components/viewport-reveal-controller";
import { getDictionary, isLocale, locales, type DesktopPerkIcon, type Locale } from "@/lib/i18n";
import { localizedPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { getDesktopPageStructuredData } from "@/lib/structured-data";

// Release assets are named by the release workflow
// (.github/workflows/release-desktop.yml); the version varies per release.
const assetName = "Threads-Analytics-x.y.z-macos-arm64.zip";

// The data folder the packaged app creates (desktop/docs/install-macos.md).
const dataFolder = "~/Library/Application Support/Threads Analytics";

// desktop/docs ships one install guide per locale.
const installGuideFile: Record<Locale, string> = {
  en: "install-macos.md",
  "zh-TW": "install-macos-zh.md",
  ja: "install-macos-ja.md",
};

const perkIcons: Record<DesktopPerkIcon, ReactNode> = {
  database: <Database strokeWidth={2} />,
  lock: <LockKeyhole strokeWidth={2} />,
  sync: <RefreshCw strokeWidth={2} />,
  bell: <BellRing strokeWidth={2} />,
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

  return (
    <>
      <JsonLd
        data={getDesktopPageStructuredData({
          locale,
          title: copy.metadata.title,
          description: copy.metadata.description,
        })}
      />
      <ViewportRevealController />
      <SiteHeader locale={locale} copy={dictionary.nav} />
      <main>
        <section className="agent-hero-section" data-motion-pause>
          <div className="hero-grid-bg" aria-hidden="true" />
          <HeroCurve />
          <div className="site-shell agent-hero-grid">
            <div className="agent-hero-copy">
              <p className="section-kicker">
                <span className="agent-hero-brandmark guide-hero-brandmark" aria-hidden="true">
                  <Laptop focusable="false" strokeWidth={2.2} />
                </span>
                {copy.hero.kicker}
              </p>
              <h1>
                <span>{copy.hero.lineOne}</span>
                <em>{copy.hero.lineTwo}</em>
              </h1>
              <p className="hero-description">{copy.hero.description}</p>
              <div className="hero-actions">
                <a
                  href={siteConfig.desktopReleases}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-primary"
                >
                  {copy.hero.primaryCta}
                  <Download aria-hidden="true" strokeWidth={2} />
                </a>
                <a href="#install" className="button button-secondary">
                  {copy.hero.secondaryCta}
                  <ArrowRight aria-hidden="true" strokeWidth={2} />
                </a>
              </div>
              <p className="hero-note">{copy.hero.note}</p>
            </div>
            <div className="agent-hero-side">
              <div className="agent-prompt-stack">
                <div className="guide-check-card desktop-download-card">
                  <div className="desktop-download-head">
                    <Image
                      src="/media/threads-analytics-icon.png"
                      alt=""
                      width={44}
                      height={44}
                      className="desktop-download-icon"
                    />
                    <span className="desktop-download-name">
                      <strong>Threads Analytics</strong>
                      <span>{copy.hero.card.platform}</span>
                    </span>
                    <span className="analytics-summary-badge">{copy.hero.card.badge}</span>
                  </div>
                  <span className="agent-prompt-label">{copy.hero.card.requirementsLabel}</span>
                  <ul className="guide-check-list">
                    {copy.hero.card.requirements.map((item) => (
                      <li key={item}>
                        <span className="guide-check-icon" aria-hidden="true">
                          <Check strokeWidth={2.6} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="guide-token-result">
                    <span className="agent-prompt-label">
                      <Download aria-hidden="true" />
                      {copy.hero.card.assetLabel}
                    </span>
                    <code className="desktop-download-file">{assetName}</code>
                  </div>
                  <p className="guide-check-note">{copy.hero.card.note}</p>
                </div>
                <p className="agent-prompt-hint desktop-hero-hint">{copy.hero.hint}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="agent-steps-section">
          <div className="site-shell">
            <div data-reveal="up">
              <div className="section-heading">
                <p className="section-kicker">{copy.preview.kicker}</p>
                <h2>{copy.preview.title}</h2>
                <p className="section-description">{copy.preview.description}</p>
              </div>
            </div>
            {/* A native window around the real dashboard screenshot, cropped
                above the web build's sign-out row — the desktop app has none. */}
            <figure className="desktop-window" data-reveal="scale" data-reveal-delay="1">
              <figcaption className="desktop-window-bar">
                <span className="desktop-window-lights" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="desktop-window-title">Threads Analytics</span>
                <span className="desktop-window-status">
                  <i aria-hidden="true" />
                  {copy.preview.status}
                </span>
              </figcaption>
              <div className="desktop-window-shot">
                <Image
                  src="/media/dashboard.png"
                  alt={copy.preview.imageAlt}
                  width={3000}
                  height={1596}
                  sizes="(max-width: 1180px) 100vw, 1120px"
                />
              </div>
            </figure>
            <div className="desktop-perks-grid" data-reveal="stagger">
              {copy.preview.perks.map((perk) => (
                <article className="analytics-method-card" key={perk.title}>
                  <span className="analytics-method-mark" aria-hidden="true">
                    {perkIcons[perk.icon]}
                  </span>
                  <strong>{perk.title}</strong>
                  <p>{perk.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="agent-steps-section">
          <div className="site-shell">
            <div data-reveal="up">
              <div className="section-heading">
                <p className="section-kicker">{copy.compare.kicker}</p>
                <h2>{copy.compare.title}</h2>
                <p className="section-description">{copy.compare.description}</p>
              </div>
            </div>
            <div className="desktop-compare" data-reveal="scale" data-reveal-delay="1">
              <table>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">{copy.compare.aspectLabel}</span>
                    </th>
                    <th scope="col" className="desktop-compare-mac">
                      <Laptop aria-hidden="true" strokeWidth={2} />
                      {copy.compare.desktopLabel}
                    </th>
                    <th scope="col">
                      <Server aria-hidden="true" strokeWidth={2} />
                      {copy.compare.webLabel}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {copy.compare.rows.map((row) => (
                    <tr key={row.aspect}>
                      <th scope="row">{row.aspect}</th>
                      <td className="desktop-compare-mac" data-label={copy.compare.desktopLabel}>
                        {row.desktop}
                      </td>
                      <td data-label={copy.compare.webLabel}>{row.web}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="giveaway-token-note desktop-note" data-reveal="up">
              <span className="giveaway-token-mark" aria-hidden="true">
                <Info strokeWidth={2} />
              </span>
              <p>{copy.compare.note}</p>
              <Link href={`/${locale}#deploy`} className="giveaway-token-link">
                {copy.compare.noteCta}
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </section>

        <section className="agent-steps-section" id="install">
          <div className="site-shell">
            <div data-reveal="up">
              <div className="section-heading">
                <p className="section-kicker">{copy.install.kicker}</p>
                <h2>{copy.install.title}</h2>
                <p className="section-description">{copy.install.description}</p>
              </div>
            </div>
            <ol
              className="mcp-steps-strip desktop-steps-strip"
              data-reveal="stagger"
              data-reveal-delay="1"
            >
              {copy.install.steps.map((step) => (
                <li key={step.index}>
                  <span className="mcp-step-num" aria-hidden="true">
                    {step.index}
                  </span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{emphasize(step.body)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="desktop-setup" data-reveal="up">
              <h3>{copy.install.setupTitle}</h3>
              <p>{copy.install.setupDescription}</p>
            </div>
            <ol className="mcp-steps-strip desktop-setup-strip" data-reveal="stagger">
              {copy.install.setupSteps.map((step) => (
                <li key={step.index}>
                  <span className="mcp-step-num" aria-hidden="true">
                    {step.index}
                  </span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{emphasize(step.body)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="giveaway-token-note desktop-note" data-reveal="up">
              <span className="giveaway-token-mark" aria-hidden="true">
                <KeyRound strokeWidth={2} />
              </span>
              <p>{copy.install.tokenNote}</p>
              <Link href={`/${locale}/token-guide`} className="giveaway-token-link">
                {copy.install.tokenCta}
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </section>

        <section className="agent-steps-section">
          <div className="site-shell">
            <div data-reveal="up">
              <div className="section-heading">
                <p className="section-kicker">{copy.firstLaunch.kicker}</p>
                <h2>{copy.firstLaunch.title}</h2>
                <p className="section-description">{copy.firstLaunch.description}</p>
              </div>
            </div>
            <div className="desktop-path-grid" data-reveal="stagger" data-reveal-delay="1">
              {copy.firstLaunch.paths.map((path) => (
                <article className="desktop-path-card" key={path.label}>
                  <span className="desktop-path-label">{path.label}</span>
                  <h3>{path.title}</h3>
                  <ol>
                    {path.steps.map((step) => (
                      <li key={step}>{emphasize(step)}</li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
            <div className="giveaway-token-note desktop-note" data-reveal="up">
              <span className="giveaway-token-mark" aria-hidden="true">
                <ShieldAlert strokeWidth={2} />
              </span>
              <p>{copy.firstLaunch.warning}</p>
              <a
                href={`${siteConfig.github}/issues`}
                target="_blank"
                rel="noreferrer"
                className="giveaway-token-link"
              >
                {copy.firstLaunch.issuesCta}
                <ArrowUpRight aria-hidden="true" strokeWidth={2} />
              </a>
            </div>
          </div>
        </section>

        <section className="agent-steps-section">
          <div className="site-shell">
            <div data-reveal="up">
              <div className="section-heading">
                <p className="section-kicker">{copy.care.kicker}</p>
                <h2>{copy.care.title}</h2>
                <p className="section-description">{copy.care.description}</p>
              </div>
            </div>
            <div className="mcp-tools-panel" data-reveal="scale" data-reveal-delay="1">
              <div className="mcp-tools-head">
                <span className="mcp-tools-name desktop-care-path">{dataFolder}</span>
                <span className="mcp-tools-badge">{copy.care.panelBadge}</span>
              </div>
              <div className="mcp-tools-list">
                {copy.care.items.map((item) => (
                  <div key={item.tag} className="mcp-tool-row">
                    <code>{item.tag}</code>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
            <a
              href={`${siteConfig.github}/blob/main/desktop/docs/${installGuideFile[locale]}`}
              target="_blank"
              rel="noreferrer"
              className="guide-links-all desktop-guide-link"
              data-reveal="fade"
            >
              {copy.care.guideCta}
              <ArrowUpRight aria-hidden="true" strokeWidth={2} />
            </a>
          </div>
        </section>

        <section className="agent-cta-section">
          <div className="site-shell" data-reveal="up">
            <div className="agent-cta guide-finish">
              <ClosingCurves />
              <div className="agent-cta-inner">
                <h2>{copy.cta.title}</h2>
                <p>{copy.cta.description}</p>
                <div className="hero-actions">
                  <a
                    href={siteConfig.desktopReleases}
                    target="_blank"
                    rel="noreferrer"
                    className="button button-light"
                  >
                    {copy.cta.primary}
                    <Download aria-hidden="true" strokeWidth={2} />
                  </a>
                  <Link href={`/${locale}#deploy`} className="button button-ghost">
                    {copy.cta.secondary}
                    <ArrowRight aria-hidden="true" strokeWidth={2} />
                  </Link>
                </div>
                <p className="guide-finish-expiry">
                  <ShieldCheck aria-hidden="true" strokeWidth={2} />
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
