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
    <div className="deploy-card deploy-card-tabbed">
      <span className="deploy-card-topline">
        <span className="deploy-eyebrow">{copy.eyebrow}</span>
        {brandMark}
      </span>
      <strong>{copy.title}</strong>
      <p>{copy.body}</p>

      <div className="deploy-switch">
        {/* Toggle buttons, not an ARIA tabs pattern: the switch only swaps
            the action link below, and tab roles would promise tabpanel
            navigation and arrow-key support that don't exist here. */}
        <div className="deploy-tabs" role="group" aria-label={copy.title}>
          <button
            type="button"
            aria-pressed={tab === "template"}
            className={tab === "template" ? "is-active" : undefined}
            onClick={() => setTab("template")}
          >
            {copy.templateTab}
          </button>
          <span className="deploy-tab-divider" aria-hidden="true" />
          <button
            type="button"
            aria-pressed={tab === "agent"}
            className={tab === "agent" ? "is-active" : undefined}
            onClick={() => setTab("agent")}
          >
            {copy.agentTab}
          </button>
        </div>

        {tab === "template" ? (
          <a
            href={templateHref}
            target="_blank"
            rel="noreferrer"
            className="deploy-tab-action"
          >
            <span className="deploy-tab-action-text">{copy.action}</span>
            <span className="deploy-tab-action-chip" aria-hidden="true">
              <ArrowUpRight className="deploy-tab-action-arrow" strokeWidth={2} />
            </span>
          </a>
        ) : (
          <Link href={walkthroughHref} className="deploy-tab-action">
            <span className="deploy-tab-action-text">{copy.agentAction}</span>
            <span className="deploy-tab-action-chip" aria-hidden="true">
              <ArrowUpRight className="deploy-tab-action-arrow" strokeWidth={2} />
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
