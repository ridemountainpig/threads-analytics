"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  Check,
  ChevronRight,
  Globe,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export type AgentDemoTimeline = {
  step: number;
  lastStep: number;
  rootRef: RefObject<HTMLDivElement | null>;
  chatRef: RefObject<HTMLDivElement | null>;
  replay: () => void;
};

// Drives a scripted chat replay. `step` advances through `stepDelays` (the
// pause in ms before entering each step) once the demo scrolls into view;
// reduced-motion visitors jump straight to the finished state. Callers must
// keep `stepDelays` referentially stable (module constant or useMemo).
// Rests at step 1 (the opening prompt) rather than 0 so the chat is never an
// empty box before playback starts.
export function useAgentDemoTimeline(stepDelays: readonly number[]): AgentDemoTimeline {
  const lastStep = stepDelays.length - 1;
  const [step, setStep] = useState(1);
  const [started, setStarted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) {
      setStarted(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || step >= lastStep) return;
    if (reduceMotionRef.current) {
      setStep(lastStep);
      return;
    }
    const timeout = setTimeout(() => setStep(step + 1), stepDelays[step + 1]);
    return () => clearTimeout(timeout);
  }, [started, step, lastStep, stepDelays]);

  useEffect(() => {
    const chat = chatRef.current;
    if (!chat || step === 0) return;
    chat.scrollTo({
      top: chat.scrollHeight,
      behavior: reduceMotionRef.current ? "auto" : "smooth",
    });
  }, [step]);

  const replay = () => {
    setStep(1);
    chatRef.current?.scrollTo({ top: 0 });
    // The timeline effect restarts from the opening prompt.
  };

  return { step, lastStep, rootRef, chatRef, replay };
}

// Window chrome + chat viewport + footer shared by the agent deploy demos.
export function AgentDemoShell({
  windowTitle,
  status,
  disclaimer,
  replayLabel,
  doneAnnouncement,
  timeline,
  children,
}: {
  windowTitle: string;
  status: string;
  disclaimer: string;
  replayLabel: string;
  /** Announced to screen readers once the replay finishes. */
  doneAnnouncement: string;
  timeline: AgentDemoTimeline;
  children: ReactNode;
}) {
  const { step, lastStep, rootRef, chatRef, replay } = timeline;
  const finished = step >= lastStep;

  return (
    <div className="agent-demo" ref={rootRef}>
      <div className="agent-demo-bar">
        <div className="window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="agent-demo-title">
          <Sparkles aria-hidden="true" strokeWidth={2} />
          {windowTitle}
        </span>
        <span className="window-live">
          <i /> {status}
        </span>
      </div>

      <div className="agent-chat" ref={chatRef}>
        {children}
      </div>

      {/* Only the outcome is announced: a live region on the chat itself
          would read every scripted step aloud for the whole replay. */}
      <p className="sr-only" aria-live="polite">
        {finished ? doneAnnouncement : null}
      </p>

      <div className="agent-demo-footer">
        <span className="agent-demo-disclaimer">{disclaimer}</span>
        {/* Enabled mid-run on purpose: clicking restarts the replay, which
            doubles as the only way to bail out of a run you've seen before. */}
        <button type="button" className="agent-replay" onClick={replay}>
          <RefreshCw aria-hidden="true" strokeWidth={2} />
          {replayLabel}
        </button>
      </div>
    </div>
  );
}

export function AgentWorkingRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className={done ? "agent-working is-done" : "agent-working"}>
      {done ? (
        <ChevronRight aria-hidden="true" strokeWidth={2.2} />
      ) : (
        <LoaderCircle className="agent-spinner" aria-hidden="true" strokeWidth={2.2} />
      )}
      {label}
    </div>
  );
}

export function AgentChips({
  chips,
  selectedIndex,
}: {
  chips: readonly string[];
  selectedIndex?: number;
}) {
  return (
    <div className="agent-chips" role="presentation">
      {chips.map((chip, index) => (
        <span
          key={chip}
          className={index === selectedIndex ? "agent-chip is-selected" : "agent-chip"}
        >
          {chip}
          <ChevronRight aria-hidden="true" strokeWidth={2} />
        </span>
      ))}
    </div>
  );
}

export function AgentResultCard({
  title,
  urlLabel,
  url,
  passwordLabel,
  password,
  note,
}: {
  title: string;
  urlLabel: string;
  url: string;
  passwordLabel: string;
  password: string;
  note: string;
}) {
  return (
    <div className="agent-result-card">
      <strong>{title}</strong>
      <div className="agent-result-row">
        <span className="agent-result-label">{urlLabel}</span>
        <span className="agent-result-url">
          <Globe aria-hidden="true" strokeWidth={1.9} />
          {url}
        </span>
      </div>
      <div className="agent-result-row">
        <span className="agent-result-label">{passwordLabel}</span>
        <code className="agent-result-password">
          <KeyRound aria-hidden="true" strokeWidth={1.9} />
          {password}
        </code>
      </div>
      <p>{note}</p>
    </div>
  );
}

// Progress lines revealed one step at a time from `startStep`; the line at
// the current step spins, earlier ones show a check.
export function AgentProgressList({
  items,
  step,
  startStep,
}: {
  items: readonly string[];
  step: number;
  startStep: number;
}) {
  return (
    <ul className="agent-progress">
      {items.map((item, index) => {
        const itemStep = startStep + index;
        if (step < itemStep) return null;
        const done = step > itemStep;
        return (
          <li key={item} className={done ? "is-done" : undefined}>
            {done ? (
              <Check aria-hidden="true" strokeWidth={2.4} />
            ) : (
              <LoaderCircle className="agent-spinner" aria-hidden="true" strokeWidth={2.2} />
            )}
            {item}
          </li>
        );
      })}
    </ul>
  );
}
