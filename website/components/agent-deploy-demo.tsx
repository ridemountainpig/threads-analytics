"use client";

import { useMemo } from "react";
import { Database, Globe } from "lucide-react";
import {
  AgentChips,
  AgentDemoShell,
  AgentProgressList,
  AgentResultCard,
  AgentWorkingRow,
  useAgentDemoTimeline,
} from "@/components/agent-demo-shell";
import type { Dictionary } from "@/lib/i18n";

const DEMO_URL = "https://threads-analytics-xxxx.zeabur.app";
const DEMO_PASSWORD = "PKLCY*SWm5vE9r*t@4FKMQIG";

// Pause (ms) before entering each fixed step: 0 idle · 1 user prompt ·
// 2 working spinner · 3-4 agent intro · 5 setup card · 6 password question ·
// 7 password chips · 8 chip picked · 9 working spinner. The progress lines
// (one step each), result card, and final done step are appended per render
// from the dictionary, so the timeline stays correct if copy changes length.
const LEAD_DELAYS = [0, 400, 700, 1500, 1150, 1100, 1150, 900, 1300, 850] as const;
const PROGRESS_DELAY = 1000;
const PROGRESS_START = LEAD_DELAYS.length;
const CHIP_PICKED_STEP = 8;

export function AgentDeployDemo({
  copy,
  promptText,
}: {
  copy: Dictionary["zeaburAgentDeploy"]["demo"];
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
      {step >= 1 && <div className="agent-bubble agent-bubble-user">{promptText}</div>}
      {step >= 2 && (
        <AgentWorkingRow label={step >= 3 ? copy.workedForA : copy.working} done={step >= 3} />
      )}
      {step >= 3 && <p className="agent-msg">{copy.lineOne}</p>}
      {step >= 4 && <p className="agent-msg">{copy.lineTwo}</p>}
      {step >= 5 && (
        <div className="agent-setup-card">
          <strong>{copy.setupTitle}</strong>
          <ul>
            <li>
              <Database aria-hidden="true" strokeWidth={1.9} />
              {copy.setupItems[0]}
            </li>
            <li>
              <Globe aria-hidden="true" strokeWidth={1.9} />
              {copy.setupItems[1]}
            </li>
          </ul>
        </div>
      )}
      {step >= 6 && <p className="agent-msg">{copy.passwordQuestion}</p>}
      {step >= 7 && (
        <AgentChips chips={copy.chips} selectedIndex={step >= CHIP_PICKED_STEP ? 0 : undefined} />
      )}
      {step >= CHIP_PICKED_STEP && (
        <div className="agent-bubble agent-bubble-user">{copy.chips[0]}</div>
      )}
      {step >= 9 && (
        <AgentWorkingRow
          label={step >= PROGRESS_START ? copy.workedForB : copy.working}
          done={step >= PROGRESS_START}
        />
      )}
      {step >= PROGRESS_START && (
        <AgentProgressList items={copy.progress} step={step} startStep={PROGRESS_START} />
      )}
      {step >= resultStep && (
        <AgentResultCard
          title={copy.doneTitle}
          urlLabel={copy.urlLabel}
          url={DEMO_URL}
          passwordLabel={copy.passwordLabel}
          password={DEMO_PASSWORD}
          note={copy.passwordNote}
        />
      )}
    </AgentDemoShell>
  );
}
