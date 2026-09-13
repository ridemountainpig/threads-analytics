"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, MessagesSquare } from "lucide-react";

type Example = { q: string; a: string; tools: string[] };

// Looping chat replay for the "try asking" card: question bubble, tool
// badges appearing as the agent works, then the sample reply. Dots switch
// questions; clicking the bubble copies the question.
export function McpChatDemo({
  label,
  examples,
  note,
}: {
  label: string;
  examples: Example[];
  note: string;
}) {
  const [index, setIndex] = useState(0);
  const [run, setRun] = useState(0);
  const [toolsShown, setToolsShown] = useState(0);
  const [replied, setReplied] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inView, setInView] = useState(false);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const example = examples[index];

  // The replay loop only advances while the card is in view — an unwatched
  // loop is pure re-render churn.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.25 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (fn: () => void, ms: number) => {
      timer = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const total = examples[index].tools.length;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      schedule(() => {
        setToolsShown(total);
        setReplied(true);
      }, 0);
    } else {
      const showTool = (n: number) => {
        setToolsShown(n);
        if (n < total) schedule(() => showTool(n + 1), 600);
        else {
          schedule(() => {
            setReplied(true);
            schedule(() => setIndex((i) => (i + 1) % examples.length), 5200);
          }, 750);
        }
      };
      schedule(() => {
        setToolsShown(0);
        setReplied(false);
        setCopied(false);
        schedule(() => showTool(1), 850);
      }, 0);
    }

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [index, run, examples, inView]);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(example.q);
    } catch {
      return;
    }
    setCopied(true);
    if (copyResetRef.current) clearTimeout(copyResetRef.current);
    copyResetRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="guide-check-card mcp-examples-card mcp-chat-card"
      data-reveal="scale"
      ref={rootRef}
    >
      <div className="mcp-chat-head">
        <span className="agent-prompt-label">
          <MessagesSquare aria-hidden="true" />
          {label}
        </span>
        <span className="mcp-chat-dots">
          {examples.map((entry, i) => (
            <button
              key={entry.q}
              type="button"
              aria-label={entry.q}
              className={i === index ? "is-active" : undefined}
              onClick={() => {
                setIndex(i);
                setRun((r) => r + 1);
              }}
            />
          ))}
        </span>
      </div>
      <div className="mcp-chat" key={`${index}-${run}`}>
        <button
          type="button"
          className={
            copied ? "agent-bubble-user mcp-chat-q is-copied" : "agent-bubble-user mcp-chat-q"
          }
          onClick={handleCopy}
        >
          {example.q}
          <span className="mcp-chat-copy" aria-hidden="true">
            {copied ? <Check strokeWidth={2.6} /> : <Copy strokeWidth={2} />}
          </span>
        </button>
        {toolsShown > 0 && (
          <div className="agent-working mcp-chat-working">
            {replied ? (
              <Check aria-hidden="true" strokeWidth={2.4} />
            ) : (
              <Loader2 aria-hidden="true" className="agent-spinner" strokeWidth={2.2} />
            )}
            {example.tools.slice(0, toolsShown).map((tool) => (
              <span key={tool} className="mcp-chat-tool">
                {tool}
              </span>
            ))}
          </div>
        )}
        {replied && <p className="agent-msg mcp-chat-reply">{example.a}</p>}
      </div>
      <p className="guide-check-note">{note}</p>
    </div>
  );
}
