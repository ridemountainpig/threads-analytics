"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type DeployTabsCopy = {
  eyebrow: string;
  title: string;
  body: string;
  templateTab: string;
  agentTab: string;
  action: string;
  agentAction: string;
};

export function DeployTabsCard({
  copy,
  templateHref,
  walkthroughHref,
  brandMark,
}: {
  copy: DeployTabsCopy;
  templateHref: string;
  walkthroughHref: string;
  brandMark: ReactNode;
}) {
  const [tab, setTab] = useState<"template" | "agent">("template");

  return (
    <div className="home-deploy-card">
      <span className="home-deploy-top">
        <span className="home-deploy-eyebrow">{copy.eyebrow}</span>
        <span className="home-deploy-mark" aria-hidden="true">
          {brandMark}
        </span>
      </span>
      <strong>{copy.title}</strong>
      <p>{copy.body}</p>

      <span className="home-deploy-footer">
        {/* Toggle buttons, not an ARIA tabs pattern: the switch only swaps
            the action link below, and tab roles would promise tabpanel
            navigation and arrow-key support that don't exist here. */}
        <span className="home-deploy-switch" role="group" aria-label={copy.title}>
          <button
            type="button"
            aria-pressed={tab === "template"}
            onClick={() => setTab("template")}
          >
            {copy.templateTab}
          </button>
          <button type="button" aria-pressed={tab === "agent"} onClick={() => setTab("agent")}>
            {copy.agentTab}
          </button>
        </span>

        {/* Both actions stay mounted in one grid cell so the switch
            crossfades; the inactive one is visibility-hidden. */}
        <span className="home-deploy-swap">
          <a
            href={templateHref}
            target="_blank"
            rel="noreferrer"
            className="home-card-link"
            data-current={tab === "template" ? "" : undefined}
          >
            {copy.action}
            <ArrowUpRight aria-hidden="true" strokeWidth={2} />
          </a>
          <Link
            href={walkthroughHref}
            className="home-card-link"
            data-current={tab === "agent" ? "" : undefined}
          >
            {copy.agentAction}
            <ArrowUpRight aria-hidden="true" strokeWidth={2} />
          </Link>
        </span>
      </span>
    </div>
  );
}
