"use client";

import { Fragment, useEffect, useRef, useState, type RefObject } from "react";
import { Check, Copy, Globe, Sparkles } from "lucide-react";

type Command = { tab: string; label: string; text: string };

function CopyButton({
  text,
  copyLabel,
  copiedLabel,
  targetRef,
}: {
  text: string;
  copyLabel: string;
  copiedLabel: string;
  targetRef: RefObject<HTMLParagraphElement | null>;
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
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard API unavailable — select the text so the user can copy
      // manually, without claiming success.
      if (targetRef.current) {
        const range = document.createRange();
        range.selectNodeContents(targetRef.current);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  return (
    <button
      type="button"
      className={copied ? "agent-prompt-copy is-copied" : "agent-prompt-copy"}
      onClick={handleCopy}
    >
      {copied ? (
        <Check aria-hidden="true" strokeWidth={2.4} />
      ) : (
        <Copy aria-hidden="true" strokeWidth={2} />
      )}
      <span className="label-swap">
        <span className={copied ? "is-ghost" : undefined}>{copyLabel}</span>
        <span className={copied ? undefined : "is-ghost"}>{copiedLabel}</span>
      </span>
    </button>
  );
}

// One dark hero card instead of two stacked ones: the endpoint on top, the
// install command below with homepage-style text tabs (Claude Code / Codex)
// as that zone's header.
export function McpHeroCard({
  endpointLabel,
  endpoint,
  commands,
  copyLabel,
  copiedLabel,
}: {
  endpointLabel: string;
  endpoint: string;
  commands: Command[];
  copyLabel: string;
  copiedLabel: string;
}) {
  const [active, setActive] = useState(0);
  const endpointRef = useRef<HTMLParagraphElement>(null);
  const commandRef = useRef<HTMLParagraphElement>(null);
  const current = commands[active];

  return (
    <div className="agent-prompt-card mcp-hero-card">
      <div className="agent-prompt-topline">
        <span className="agent-prompt-label">
          <Globe aria-hidden="true" strokeWidth={1.9} />
          {endpointLabel}
        </span>
        <CopyButton
          text={endpoint}
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
          targetRef={endpointRef}
        />
      </div>
      <div className="agent-prompt-input">
        <p className="agent-prompt-text mcp-text-static" ref={endpointRef}>
          {endpoint}
        </p>
      </div>

      <div className="mcp-hero-divider" aria-hidden="true" />

      <div className="agent-prompt-topline">
        <span className="mcp-hero-cmd-head">
          <Sparkles aria-hidden="true" strokeWidth={1.9} />
          <span
            className="deploy-tabs mcp-tabs mcp-tabs-dark"
            role="group"
            aria-label={current.label}
          >
            {commands.map((command, i) => (
              <Fragment key={command.tab}>
                {i > 0 && <span className="deploy-tab-divider" aria-hidden="true" />}
                <button
                  type="button"
                  aria-pressed={i === active}
                  className={i === active ? "is-active" : undefined}
                  onClick={() => setActive(i)}
                >
                  {command.tab}
                </button>
              </Fragment>
            ))}
          </span>
        </span>
        {/* key resets the copied state when the command changes. */}
        <CopyButton
          key={current.tab}
          text={current.text}
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
          targetRef={commandRef}
        />
      </div>
      <div className="agent-prompt-input">
        <p className="agent-prompt-text" ref={commandRef} key={current.tab}>
          {current.text}
        </p>
      </div>
    </div>
  );
}
