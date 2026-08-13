"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export function AgentHeroActions({
  copy,
  promptText,
  openHref,
}: {
  copy:
    | Dictionary["zeaburAgentDeploy"]["hero"]
    | Dictionary["railwayAgentDeploy"]["hero"]
    | Dictionary["vercelAgentDeploy"]["hero"];
  promptText: string;
  openHref: string;
}) {
  const [copied, setCopied] = useState(false);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard unavailable — the prompt card below still allows manual copy.
      document.querySelector(".agent-prompt-card")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="hero-actions">
      <button type="button" className="button button-primary" onClick={handleCopy}>
        {/* Both labels stay in the layout so the button keeps the wider
            label's width — no jump when the text swaps on copy. */}
        <span className="label-swap">
          <span className={copied ? "is-ghost" : undefined}>{copy.copyCta}</span>
          <span className={copied ? undefined : "is-ghost"}>{copy.copiedCta}</span>
        </span>
        {copied ? (
          <Check aria-hidden="true" strokeWidth={2.4} />
        ) : (
          <Copy aria-hidden="true" strokeWidth={2} />
        )}
      </button>
      <a href={openHref} target="_blank" rel="noreferrer" className="button button-secondary">
        {copy.openCta}
        <ArrowUpRight aria-hidden="true" strokeWidth={2} />
      </a>
    </div>
  );
}
