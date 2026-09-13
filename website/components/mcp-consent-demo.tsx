"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, ShieldCheck, ShieldX } from "lucide-react";

type ConsentDialog = {
  title: string;
  subtitle: string;
  scopeTitle: string;
  scopeRead: string;
  scopeNoWrite: string;
  deny: string;
  approve: string;
};

// The consent-screen recreation as a small playable demo: clicking Authorize
// flashes the connected state, then the dialog resets.
export function McpConsentDemo({
  dialog,
  connected,
}: {
  dialog: ConsentDialog;
  connected: string;
}) {
  const [authorized, setAuthorized] = useState(false);
  const [denied, setDenied] = useState(false);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, []);

  const approve = () => {
    setAuthorized(true);
    if (resetRef.current) clearTimeout(resetRef.current);
    resetRef.current = setTimeout(() => setAuthorized(false), 2600);
  };

  return (
    <div
      className={
        denied ? "mcp-mock-dialog mcp-mock-consent is-denied" : "mcp-mock-dialog mcp-mock-consent"
      }
      onAnimationEnd={(event) => {
        if (event.animationName === "mcp-deny-shake") setDenied(false);
      }}
    >
      <Image
        src="/media/threads-analytics-icon.png"
        alt=""
        width={36}
        height={36}
        className="mcp-mock-appicon"
      />
      <p className="mcp-mock-title">{dialog.title}</p>
      <p className="mcp-mock-sub">{dialog.subtitle}</p>
      {authorized ? (
        <div className="mcp-mock-success" role="status">
          <span className="guide-check-icon" aria-hidden="true">
            <Check strokeWidth={2.6} />
          </span>
          {connected}
        </div>
      ) : (
        <>
          <div className="mcp-mock-scope">
            <p className="mcp-mock-scope-title">{dialog.scopeTitle}</p>
            <p className="mcp-mock-scope-row">
              <ShieldCheck aria-hidden="true" strokeWidth={2.1} />
              <span>{dialog.scopeRead}</span>
            </p>
            <p className="mcp-mock-scope-row is-muted">
              <ShieldX aria-hidden="true" strokeWidth={2.1} />
              <span>{dialog.scopeNoWrite}</span>
            </p>
          </div>
          <div className="mcp-mock-actions">
            {/* Nothing to actually deny in a mockup — answer the click with
                a head-shake instead of silence. */}
            <button type="button" className="mcp-mock-btn" onClick={() => setDenied(true)}>
              {dialog.deny}
            </button>
            <button type="button" className="mcp-mock-btn mcp-mock-btn-primary" onClick={approve}>
              {dialog.approve}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
