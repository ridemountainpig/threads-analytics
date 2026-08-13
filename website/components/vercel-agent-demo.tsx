"use client";

import { useMemo } from "react";
import {
  Check,
  ChevronDown,
  ClipboardCheck,
  Database,
  Globe,
  Lock,
  ShieldCheck,
} from "lucide-react";
import {
  AgentChips,
  AgentDemoShell,
  AgentProgressList,
  AgentWorkingRow,
  useAgentDemoTimeline,
} from "@/components/agent-demo-shell";
import { Vercel } from "@/components/deployment-logos";
import type { Dictionary } from "@/lib/i18n";

const DEMO_URL = "https://threads-analytics-xxxx.vercel.app";

// Pause (ms) before entering each fixed step: 0 idle · 1 runbook prompt ·
// 2 working spinner · 3 plan message · 4 MCP approval card · 5 approval
// allowed · 6 MCP tool row · 7 dashboard-pause message · 8 "signed in" reply ·
// 9 working spinner · 10 browser card (Neon) · 11 setup summary ·
// 12 password question · 13 password chips · 14 chip picked · 15 working
// spinner. The progress lines (one step each), result card, and final done
// step are appended per render from the dictionary, so the timeline stays
// correct if copy changes length.
const LEAD_DELAYS = [
  0, 400, 700, 2200, 1200, 900, 1100, 1400, 1100, 800, 1600, 1500, 1200, 900, 1300, 850,
] as const;
const PROGRESS_DELAY = 1000;
const PROGRESS_START = LEAD_DELAYS.length;
const CHIP_PICKED_STEP = 14;

export function VercelAgentDemo({
  copy,
  promptText,
}: {
  copy: Dictionary["vercelAgentDeploy"]["demo"];
  promptText: string;
}) {
  const stepDelays = useMemo(
    () => [...LEAD_DELAYS, ...copy.progress.map(() => PROGRESS_DELAY), 1150, 800],
    [copy],
  );
  const resultStep = PROGRESS_START + copy.progress.length;
  const timeline = useAgentDemoTimeline(stepDelays);
  const { step } = timeline;

  return (
    <AgentDemoShell
      windowTitle={copy.windowTitle}
      status={copy.status}
      disclaimer={copy.disclaimer}
      replayLabel={copy.replay}
      doneAnnouncement={copy.doneTitle}
      timeline={timeline}
    >
      {step >= 1 && (
        <div className="agent-bubble agent-bubble-user agent-bubble-prompt">
          <p>{promptText}</p>
          <span className="agent-bubble-more">
            {copy.promptMore}
            <ChevronDown aria-hidden="true" strokeWidth={2.2} />
          </span>
        </div>
      )}
      {step >= 2 && (
        <AgentWorkingRow label={step >= 3 ? copy.workedForA : copy.working} done={step >= 3} />
      )}
      {step >= 3 && <p className="agent-msg">{copy.planLine}</p>}
      {step >= 4 && (
        <div className={step >= 5 ? "agent-approval-card is-approved" : "agent-approval-card"}>
          <div className="agent-approval-head">
            <ShieldCheck aria-hidden="true" strokeWidth={1.9} />
            {copy.approvalTitle}
          </div>
          <code className="agent-approval-tool">{copy.approvalTool}</code>
          <p>{copy.approvalDesc}</p>
          <div className="agent-approval-actions">
            <span
              className={step >= 5 ? "agent-approval-allow is-selected" : "agent-approval-allow"}
            >
              <Check aria-hidden="true" strokeWidth={2.4} />
              {copy.approvalAllow}
            </span>
            <span className="agent-approval-deny">{copy.approvalDeny}</span>
          </div>
        </div>
      )}
      {step >= 6 && (
        <div className="agent-tool-row">
          <span className="agent-tool-badge">
            <Vercel aria-hidden="true" focusable="false" />
            {copy.toolBadge}
          </span>
          {copy.toolLine}
        </div>
      )}
      {step >= 7 && <p className="agent-msg">{copy.pauseLine}</p>}
      {step >= 8 && <div className="agent-bubble agent-bubble-user">{copy.signedIn}</div>}
      {step >= 9 && (
        <AgentWorkingRow label={step >= 10 ? copy.workedForB : copy.working} done={step >= 10} />
      )}
      {step >= 10 && (
        <div className="agent-browser-card">
          <div className="agent-browser-bar">
            <span className="window-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="agent-browser-url">
              <Lock aria-hidden="true" strokeWidth={2.2} />
              {copy.browserUrl}
            </span>
            <span className="agent-browser-badge">{copy.browserLabel}</span>
          </div>
          <div className="agent-browser-body">
            <strong>{copy.browserTitle}</strong>
            <div className="agent-browser-provider">
              <span className="agent-browser-provider-name">
                <Database aria-hidden="true" strokeWidth={1.9} />
                {copy.browserProvider}
              </span>
              <Check aria-hidden="true" strokeWidth={2.6} />
            </div>
            <ul className="agent-browser-specs">
              {copy.browserSpecs.map((spec) => (
                <li key={spec.label}>
                  <span>{spec.label}</span>
                  <b>{spec.value}</b>
                </li>
              ))}
            </ul>
            <span className="agent-browser-cta">{copy.browserCta}</span>
          </div>
        </div>
      )}
      {step >= 11 && (
        <div className="agent-setup-card">
          <strong>{copy.setupTitle}</strong>
          <ul>
            <li>
              <Database aria-hidden="true" strokeWidth={1.9} />
              {copy.setupItems[0]}
            </li>
            <li>
              <ShieldCheck aria-hidden="true" strokeWidth={1.9} />
              {copy.setupItems[1]}
            </li>
          </ul>
        </div>
      )}
      {step >= 12 && <p className="agent-msg">{copy.passwordQuestion}</p>}
      {step >= 13 && (
        <AgentChips chips={copy.chips} selectedIndex={step >= CHIP_PICKED_STEP ? 0 : undefined} />
      )}
      {step >= CHIP_PICKED_STEP && (
        <div className="agent-bubble agent-bubble-user">{copy.chips[0]}</div>
      )}
      {step >= 15 && (
        <AgentWorkingRow
          label={step >= PROGRESS_START ? copy.workedForC : copy.working}
          done={step >= PROGRESS_START}
        />
      )}
      {step >= PROGRESS_START && (
        <AgentProgressList items={copy.progress} step={step} startStep={PROGRESS_START} />
      )}
      {step >= resultStep && (
        <div className="agent-result-card">
          <strong>{copy.doneTitle}</strong>
          <div className="agent-result-row">
            <span className="agent-result-label">{copy.urlLabel}</span>
            <span className="agent-result-url">
              <Globe aria-hidden="true" strokeWidth={1.9} />
              {DEMO_URL}
            </span>
          </div>
          <div className="agent-result-row">
            <span className="agent-result-label">{copy.metaLabel}</span>
            <span className="agent-result-meta">
              {copy.metaItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </span>
          </div>
          <div className="agent-result-row">
            <span className="agent-result-label">{copy.passwordLabel}</span>
            <code className="agent-result-password">
              <ClipboardCheck aria-hidden="true" strokeWidth={1.9} />
              {copy.passwordValue}
            </code>
          </div>
          <p>{copy.passwordNote}</p>
        </div>
      )}
    </AgentDemoShell>
  );
}
