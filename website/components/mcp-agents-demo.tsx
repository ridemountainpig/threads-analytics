"use client";

import { useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";

type AgentsPanel = {
  title: string;
  subtitle: string;
  revoke: string;
  agents: { name: string; meta: string }[];
};

// The Connected Agents settings card as a small playable demo: clicking
// Revoke fades the row out, then it comes back.
export function McpAgentsDemo({ panel }: { panel: AgentsPanel }) {
  const [revoked, setRevoked] = useState<number | null>(null);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, []);

  const revoke = (index: number) => {
    setRevoked(index);
    if (resetRef.current) clearTimeout(resetRef.current);
    resetRef.current = setTimeout(() => setRevoked(null), 2200);
  };

  return (
    <div className="mcp-mock-dialog mcp-mock-agents">
      <p className="mcp-mock-title">{panel.title}</p>
      <p className="mcp-mock-sub">{panel.subtitle}</p>
      <div className="mcp-mock-agent-list">
        {panel.agents.map((agent, i) => (
          <div
            key={agent.name}
            className={revoked === i ? "mcp-mock-agent is-revoked" : "mcp-mock-agent"}
          >
            <Bot aria-hidden="true" strokeWidth={2} />
            <div className="mcp-mock-agent-info">
              <strong>{agent.name}</strong>
              <span>{agent.meta}</span>
            </div>
            <button type="button" className="mcp-mock-btn" onClick={() => revoke(i)}>
              {panel.revoke}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
