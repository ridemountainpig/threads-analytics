"use client";

import { useMemo } from "react";
import { SquareTerminal, Unplug } from "lucide-react";
import {
  AgentChips,
  AgentDemoShell,
  AgentProgressList,
  AgentResultCard,
  AgentWorkingRow,
  useAgentDemoTimeline,
} from "@/components/agent-demo-shell";
import type { Dictionary } from "@/lib/i18n";

const DEMO_URL = "https://threads-analytics.up.railway.app";
const DEMO_PASSWORD = "TgV7#mKq2wRz8!pLd4Cx";

// Pause (ms) before entering each fixed step: 0 idle · 1 install prompt ·
// 2 working spinner · 3 tools-ready card · 4 deploy prompt · 5 working
// spinner · 6 password question · 7 password chips · 8 chip picked ·
// 9 working spinner. The progress lines (one step each) and TAIL_DELAYS
// (deploy-done message · domain prompt · working spinner · result card ·
// done) are appended per render from the dictionary, so the timeline stays
// correct if copy changes length.
const LEAD_DELAYS = [0, 400, 700, 1500, 1100, 800, 1500, 900, 1300, 850] as const;
const TAIL_DELAYS = [1250, 1300, 800, 1500, 1150] as const;
const PROGRESS_DELAY = 1000;
const PROGRESS_START = LEAD_DELAYS.length;
const CHIP_PICKED_STEP = 8;

export function RailwayAgentDemo({
  copy,
  installPrompt,
  deployPrompt,
}: {
  copy: Dictionary["railwayAgentDeploy"]["demo"];
  installPrompt: string;
  deployPrompt: string;
}) {
  const stepDelays = useMemo(
    () => [...LEAD_DELAYS, ...copy.progress.map(() => PROGRESS_DELAY), ...TAIL_DELAYS],
    [copy],
  );
  const deployDoneStep = PROGRESS_START + copy.progress.length;
  const domainPromptStep = deployDoneStep + 1;
  const domainWorkingStep = deployDoneStep + 2;
  const resultStep = deployDoneStep + 3;
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
      {step >= 1 && <div className="agent-bubble agent-bubble-user">{installPrompt}</div>}
      {step >= 2 && (
        <AgentWorkingRow label={step >= 3 ? copy.workedForA : copy.working} done={step >= 3} />
      )}
      {step >= 3 && (
        <div className="agent-setup-card">
          <strong>{copy.toolsTitle}</strong>
          <ul>
            <li>
              <SquareTerminal aria-hidden="true" strokeWidth={1.9} />
              {copy.toolsItems[0]}
            </li>
            <li>
              <Unplug aria-hidden="true" strokeWidth={1.9} />
              {copy.toolsItems[1]}
            </li>
          </ul>
        </div>
      )}
      {step >= 4 && <div className="agent-bubble agent-bubble-user">{deployPrompt}</div>}
      {step >= 5 && (
        <AgentWorkingRow label={step >= 6 ? copy.workedForB : copy.working} done={step >= 6} />
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
          label={step >= PROGRESS_START ? copy.workedForC : copy.working}
          done={step >= PROGRESS_START}
        />
      )}
      {step >= PROGRESS_START && (
        <AgentProgressList items={copy.progress} step={step} startStep={PROGRESS_START} />
      )}
      {step >= deployDoneStep && <p className="agent-msg">{copy.deployDone}</p>}
      {step >= domainPromptStep && (
        <div className="agent-bubble agent-bubble-user">{copy.domainPrompt}</div>
      )}
      {step >= domainWorkingStep && (
        <AgentWorkingRow
          label={step >= resultStep ? copy.workedForD : copy.working}
          done={step >= resultStep}
        />
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
