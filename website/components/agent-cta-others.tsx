import Link from "next/link";
import { Railway, Vercel, Zeabur } from "@/components/deployment-logos";
import type { Locale } from "@/lib/i18n";

const PLATFORMS = [
  { slug: "zeabur-agent", name: "Zeabur", Logo: Zeabur },
  { slug: "railway-agent", name: "Railway", Logo: Railway },
  { slug: "vercel-agent", name: "Vercel", Logo: Vercel },
] as const;

export type AgentPlatformSlug = (typeof PLATFORMS)[number]["slug"];

// Cross-links to the sibling agent deploy pages, shown under the closing CTA
// so the page isn't a dead end for visitors on the wrong platform. The current
// page's platform is left out.
export function AgentCtaOthers({
  locale,
  label,
  current,
}: {
  locale: Locale;
  label: string;
  current: AgentPlatformSlug;
}) {
  return (
    <div className="agent-cta-others">
      <span className="agent-cta-others-label">{label}</span>
      {PLATFORMS.filter((platform) => platform.slug !== current).map(({ slug, name, Logo }) => (
        <Link key={slug} href={`/${locale}/deploy/${slug}`} className="agent-cta-other">
          {/* The brand marks are dark-on-light artwork, so they sit on a
              small light chip like the hero brandmark. */}
          <span className="agent-cta-other-mark" aria-hidden="true">
            <Logo focusable="false" />
          </span>
          {name}
        </Link>
      ))}
    </div>
  );
}
