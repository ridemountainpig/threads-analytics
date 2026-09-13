import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Plug, ShieldCheck } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { RiOpenaiFill } from "react-icons/ri";
import { SiClaude, SiClaudecode, SiCursor } from "react-icons/si";
import { ClosingCurves } from "@/components/closing-curves";
import { HeroCurve } from "@/components/hero-curve";
import { JsonLd } from "@/components/json-ld";
import { McpAgentsDemo } from "@/components/mcp-agents-demo";
import { McpClientSwitcher } from "@/components/mcp-client-switcher";
import { McpChatDemo } from "@/components/mcp-chat-demo";
import { McpConsentDemo } from "@/components/mcp-consent-demo";
import { McpHeroCard } from "@/components/mcp-hero-card";
import { McpTermDemo } from "@/components/mcp-term-demo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ViewportRevealController } from "@/components/viewport-reveal-controller";
import type { ReactNode } from "react";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { localizedPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { getDeployPageStructuredData } from "@/lib/structured-data";

const mcpDocsUrl = "https://modelcontextprotocol.io";

// The endpoint is the same on every deployment except for the domain, so the
// placeholder matches the README and the hint tells readers what to swap.
const mcpEndpoint = "https://your-deployment.example.com/api/mcp";
const claudeCodeCommand = `claude mcp add --transport http threads-analytics ${mcpEndpoint}`;
const codexCommand = `codex mcp add threads-analytics --url ${mcpEndpoint}`;

// Window frame for the recreated UI mockups (reuses the token guide's
// screenshot chrome).
function MockFrame({
  domain,
  badge,
  interactive,
  children,
}: {
  domain: string;
  badge: string;
  /** Set for mockups the reader can actually click (e.g. the consent demo). */
  interactive?: boolean;
  children: ReactNode;
}) {
  return (
    <figure className="guide-shot mcp-frame">
      <figcaption className="guide-shot-bar">
        <span className="window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="guide-shot-domain">{domain}</span>
        <span className="guide-shot-step">{badge}</span>
      </figcaption>
      <div className="mcp-shot-body" aria-hidden={interactive ? undefined : "true"}>
        {children}
      </div>
    </figure>
  );
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
  const copy = getDictionary(locale).mcpGuide;

  return localizedPageMetadata({
    locale,
    path: "/mcp",
    title: copy.metadata.title,
    description: copy.metadata.description,
    ogImageSet: "mcp",
  });
}

export default async function McpGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const copy = dictionary.mcpGuide;

  return (
    <>
      <JsonLd
        data={getDeployPageStructuredData({
          locale,
          path: "/mcp",
          title: copy.metadata.title,
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
                  <Plug focusable="false" strokeWidth={2.2} />
                </span>
                {copy.hero.kicker}
              </p>
              <h1>
                <span>{copy.hero.lineOne}</span>
                <em>{copy.hero.lineTwo}</em>
              </h1>
              <p className="hero-description">{copy.hero.description}</p>
              <div className="hero-actions">
                <a href="#connect" className="button button-primary">
                  {copy.hero.primaryCta}
                  <ArrowRight aria-hidden="true" strokeWidth={2} />
                </a>
                <a
                  href={mcpDocsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-secondary"
                >
                  {copy.hero.secondaryCta}
                  <ArrowUpRight aria-hidden="true" strokeWidth={2} />
                </a>
              </div>
              <p className="hero-note">{copy.hero.note}</p>
              <div className="agent-works">
                <span className="agent-works-label">{copy.hero.worksWith}</span>
                <span className="agent-works-chips">
                  <span className="agent-works-chip agent-works-chip-claude">
                    <SiClaudecode aria-hidden="true" />
                    Claude Code
                  </span>
                  <span className="agent-works-chip">
                    <SiClaude aria-hidden="true" />
                    Claude
                  </span>
                  <span className="agent-works-chip">
                    <RiOpenaiFill aria-hidden="true" />
                    Codex
                  </span>
                  <span className="agent-works-chip">
                    <SiCursor aria-hidden="true" />
                    Cursor
                  </span>
                  <span className="agent-works-chip agent-works-chip-more">
                    {copy.hero.moreAgents}
                  </span>
                </span>
              </div>
            </div>
            <div className="agent-hero-side">
              <div className="agent-prompt-stack">
                <McpHeroCard
                  endpointLabel={copy.hero.endpointLabel}
                  endpoint={mcpEndpoint}
                  commands={[
                    { tab: "Claude Code", label: copy.hero.commandLabel, text: claudeCodeCommand },
                    { tab: "Codex", label: copy.hero.codexCommandLabel, text: codexCommand },
                  ]}
                  copyLabel={copy.hero.copy}
                  copiedLabel={copy.hero.copied}
                />
                <p className="agent-prompt-hint">{copy.hero.hint}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="agent-steps-section">
          <div className="site-shell">
            <div data-reveal="up">
              <div className="section-heading">
                <p className="section-kicker">{copy.capabilities.kicker}</p>
                <h2>{copy.capabilities.title}</h2>
                <p className="section-description">{copy.capabilities.description}</p>
              </div>
            </div>
            <div className="mcp-tools-panel" data-reveal="scale" data-reveal-delay="1">
              <div className="mcp-tools-head">
                <span className="mcp-tools-name">threads-analytics · MCP</span>
                <span className="mcp-tools-badge">{copy.capabilities.panelBadge}</span>
              </div>
              <div className="mcp-tools-list">
                {copy.capabilities.items.map((item) => (
                  <div key={item.tag} className="mcp-tool-row">
                    <code>{item.tag}</code>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="agent-steps-section" id="connect">
          <div className="site-shell">
            <div data-reveal="up">
              <div className="section-heading">
                <p className="section-kicker">{copy.connect.kicker}</p>
                <h2>{copy.connect.title}</h2>
                <p className="section-description">{copy.connect.description}</p>
              </div>
            </div>
            <ol className="mcp-steps-strip" data-reveal="stagger" data-reveal-delay="1">
              {copy.connect.steps.map((step) => (
                <li key={step.index}>
                  <span className="mcp-step-num" aria-hidden="true">
                    {step.index}
                  </span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            {/* The mockups are recreated UI, not screenshots — the consent
                screen mirrors app/oauth/authorize in the app repo. */}
            <div data-reveal="up">
              <McpClientSwitcher
                tabs={copy.connect.clients.map(({ tag, title, body }) => ({
                  tab: tag,
                  title,
                  body,
                }))}
                panels={[
                  <figure key="claude-code" className="mcp-term-window" aria-hidden="true">
                    <figcaption className="mcp-term-bar">
                      <span className="window-dots">
                        <span />
                        <span />
                        <span />
                      </span>
                      <span>terminal</span>
                    </figcaption>
                    <McpTermDemo command={claudeCodeCommand} />
                  </figure>,
                  <MockFrame key="claude" domain="claude.ai" badge="Claude">
                    <div className="mcp-mock-dialog">
                      <p className="mcp-mock-title">Add custom connector</p>
                      <p className="mcp-mock-label">Name</p>
                      <div className="mcp-mock-input">Threads Analytics</div>
                      <p className="mcp-mock-label">Remote MCP server URL</p>
                      <div className="mcp-mock-input mcp-mock-mono">{mcpEndpoint}</div>
                      <div className="mcp-mock-actions">
                        <span className="mcp-mock-btn">Cancel</span>
                        <span className="mcp-mock-btn mcp-mock-btn-primary">Continue</span>
                      </div>
                    </div>
                  </MockFrame>,
                  <MockFrame key="codex" domain="Codex" badge="Codex">
                    <div className="mcp-mock-dialog">
                      <p className="mcp-mock-title">Connect to custom MCP</p>
                      <p className="mcp-mock-label">Name</p>
                      <div className="mcp-mock-input">threads-analytics</div>
                      <div className="mcp-mock-typerow">
                        <span className="mcp-mock-label">Type</span>
                        <span className="mcp-mock-chip">STDIO</span>
                        <span className="mcp-mock-chip is-active">Streamable HTTP</span>
                      </div>
                      <p className="mcp-mock-label">URL</p>
                      <div className="mcp-mock-input mcp-mock-mono">{mcpEndpoint}</div>
                    </div>
                  </MockFrame>,
                  <figure key="cursor" className="mcp-code-window" aria-hidden="true">
                    <figcaption className="mcp-term-bar mcp-code-bar">
                      <span className="window-dots">
                        <span />
                        <span />
                        <span />
                      </span>
                      <span>.cursor/mcp.json</span>
                    </figcaption>
                    <div className="mcp-code-body">{`{
  "mcpServers": {
    "threads-analytics": {
      "url": "${mcpEndpoint}"
    }
  }
}`}</div>
                  </figure>,
                ]}
              />
            </div>
            <div className="mcp-consent-row" data-reveal="up">
              <div className="mcp-consent-copy">
                <h3>{copy.connect.consent.title}</h3>
                <p>{copy.connect.consent.body}</p>
              </div>
              <MockFrame domain="your-deployment.example.com" badge="OAuth" interactive>
                <McpConsentDemo
                  dialog={copy.connect.consent.dialog}
                  connected={copy.connect.consent.connected}
                />
              </MockFrame>
            </div>
            <div className="mcp-manage-row" data-reveal="up">
              <MockFrame domain="your-deployment.example.com" badge="Settings" interactive>
                <McpAgentsDemo panel={copy.connect.manage.panel} />
              </MockFrame>
              <div className="mcp-consent-copy">
                <h3>{copy.connect.manage.title}</h3>
                <p>{copy.connect.manage.body}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="agent-steps-section">
          <div className="site-shell">
            <div data-reveal="up">
              <div className="section-heading">
                <p className="section-kicker">{copy.usage.kicker}</p>
                <h2>{copy.usage.title}</h2>
                <p className="section-description">{copy.usage.description}</p>
              </div>
            </div>
            <McpChatDemo
              label={copy.usage.examplesLabel}
              examples={copy.usage.examples}
              note={copy.usage.examplesNote}
            />
            <div className="mcp-prompts-panel" data-reveal="up" data-reveal-delay="1">
              <div className="mcp-prompts-head">
                <span className="guide-phase-range">{copy.usage.promptsLabel}</span>
              </div>
              <div className="mcp-prompts-list">
                {copy.usage.prompts.map((prompt) => (
                  <div key={prompt.tag} className="mcp-prompt-row">
                    <code>{prompt.tag}</code>
                    <strong>{prompt.title}</strong>
                    <p>{prompt.body}</p>
                  </div>
                ))}
              </div>
            </div>
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
                  <a href="#connect" className="button button-light">
                    {copy.cta.primary}
                    <ArrowRight aria-hidden="true" strokeWidth={2} />
                  </a>
                  <a
                    href={`${siteConfig.github}#mcp-server`}
                    target="_blank"
                    rel="noreferrer"
                    className="button button-ghost"
                  >
                    <FaGithub className="github-icon" aria-hidden="true" />
                    {copy.cta.secondary}
                  </a>
                </div>
                <p className="guide-finish-expiry">
                  <ShieldCheck aria-hidden="true" strokeWidth={2} />
                  {copy.cta.revokeNote}
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
