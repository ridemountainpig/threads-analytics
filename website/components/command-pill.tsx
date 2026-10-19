"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export function CommandPill({
  command,
  copyLabel,
  copiedLabel,
  prompt = "$",
  className,
}: {
  command: string;
  copyLabel: string;
  copiedLabel: string;
  prompt?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const resetRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetRef.current), []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable (http, permissions): select the command so
      // it can be copied by hand, without claiming success.
      if (!codeRef.current) return;
      const range = document.createRange();
      range.selectNodeContents(codeRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };

  return (
    <div className={className ? `command-pill ${className}` : "command-pill"}>
      <span className="command-pill-prompt" aria-hidden="true">
        {prompt}
      </span>
      <code ref={codeRef}>{command}</code>
      <button
        type="button"
        className="command-pill-copy"
        onClick={handleCopy}
        aria-label={copyLabel}
        data-copied={copied ? "" : undefined}
      >
        {copied ? (
          <Check key="copied" aria-hidden="true" strokeWidth={2} />
        ) : (
          <Copy key="copy" aria-hidden="true" strokeWidth={1.8} />
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? copiedLabel : ""}
      </span>
    </div>
  );
}
