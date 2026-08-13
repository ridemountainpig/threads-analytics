"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, ChevronDown, Copy, Sparkles } from "lucide-react";

// Shared prompt card for the agent deploy pages: label + prompt text + copy
// button, with an optional send row (domain chip + arrow link) for platforms
// with a hosted agent box. Used standalone (Zeabur) and inside
// .agent-prompt-stack (Railway). Multi-paragraph runbook prompts (Vercel)
// pass `expand` to render collapsed with a show-more toggle; copying always
// copies the full text.
export function AgentPromptCard({
  label,
  text,
  copyLabel,
  copiedLabel,
  hint,
  send,
  expand,
}: {
  label: string;
  text: string;
  copyLabel: string;
  copiedLabel: string;
  hint?: string;
  send?: { href: string; label: string; domain: string };
  expand?: { moreLabel: string; lessLabel: string };
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    return () => {
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, []);

  const markCopied = () => {
    setCopied(true);
    if (resetRef.current) clearTimeout(resetRef.current);
    resetRef.current = setTimeout(() => setCopied(false), 2200);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      markCopied();
    } catch {
      // Clipboard API unavailable (http, permissions) — select the text so
      // the user can copy manually, without claiming success.
      if (textRef.current) {
        const range = document.createRange();
        range.selectNodeContents(textRef.current);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  return (
    <div className={expand ? "agent-prompt-card agent-prompt-card-long" : "agent-prompt-card"}>
      <div className="agent-prompt-topline">
        <span className="agent-prompt-label">
          <Sparkles aria-hidden="true" strokeWidth={1.9} />
          {label}
        </span>
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
      </div>
      <div
        className={
          expand
            ? expanded
              ? "agent-prompt-input is-scrollable"
              : "agent-prompt-input is-clamped"
            : "agent-prompt-input"
        }
      >
        <p className="agent-prompt-text" ref={textRef}>
          {text}
        </p>
        {expand ? (
          <button
            type="button"
            className="agent-prompt-expand"
            aria-expanded={expanded}
            onClick={() => {
              // Collapsing: rewind so the clamped preview shows the top again.
              if (expanded && textRef.current) textRef.current.scrollTop = 0;
              setExpanded(!expanded);
            }}
          >
            {expanded ? expand.lessLabel : expand.moreLabel}
            <ChevronDown aria-hidden="true" strokeWidth={2.2} />
          </button>
        ) : null}
        {send ? (
          <div className="agent-prompt-inputrow">
            <span className="agent-prompt-domain">{send.domain}</span>
            <a
              href={send.href}
              target="_blank"
              rel="noreferrer"
              className="agent-prompt-send"
              aria-label={send.label}
              title={send.label}
              onClick={() => {
                navigator.clipboard?.writeText(text).then(markCopied, () => {});
              }}
            >
              <ArrowUp aria-hidden="true" strokeWidth={2.4} />
            </a>
          </div>
        ) : null}
      </div>
      {hint ? <p className="agent-prompt-hint">{hint}</p> : null}
    </div>
  );
}
