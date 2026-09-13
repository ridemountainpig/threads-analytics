"use client";

import { Fragment, useState, type ReactNode } from "react";

type ClientTab = { tab: string; title: string; body: string };

// One card instead of a card per client: homepage-style text tabs swap the
// instructions on the left and the matching UI mockup on the right. The
// mockups are rendered on the server and passed in, index-aligned with `tabs`.
export function McpClientSwitcher({ tabs, panels }: { tabs: ClientTab[]; panels: ReactNode[] }) {
  const [active, setActive] = useState(0);
  const current = tabs[active];

  return (
    <div className="mcp-client-card">
      <div className="deploy-tabs mcp-tabs mcp-client-tabs" role="group" aria-label={current.title}>
        {tabs.map((tab, i) => (
          <Fragment key={tab.tab}>
            {i > 0 && <span className="deploy-tab-divider" aria-hidden="true" />}
            <button
              type="button"
              aria-pressed={i === active}
              className={i === active ? "is-active" : undefined}
              onClick={() => setActive(i)}
            >
              {tab.tab}
            </button>
          </Fragment>
        ))}
      </div>
      <div className="mcp-client-panel" key={current.tab}>
        <div className="mcp-client-copy">
          <strong>{current.title}</strong>
          <p>{current.body}</p>
        </div>
        {panels[active]}
      </div>
    </div>
  );
}
