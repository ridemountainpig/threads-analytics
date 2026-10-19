"use client";

import { useEffect, useState, type ReactNode } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { CircleCheck, X } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import type { DesktopGuideCopy } from "@/lib/i18n";

const DOWNLOAD_EVENT = "desktop-download-start";

// sendGAEvent warns on every call when GA isn't loaded (no NEXT_PUBLIC_GA_ID).
function track(name: string, params: Record<string, string>) {
  if (process.env.NEXT_PUBLIC_GA_ID) sendGAEvent("event", name, params);
}

/**
 * A Download button. With `version` it points straight at the release ZIP and
 * raises the notice below; without it, it opens the Releases page instead.
 */
export function DesktopDownloadLink({
  href,
  version,
  className,
  children,
}: {
  href: string;
  version?: string;
  className: string;
  children: ReactNode;
}) {
  if (!version) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        track("desktop_download", { version });
        window.dispatchEvent(new Event(DOWNLOAD_EVENT));
      }}
    >
      {children}
    </a>
  );
}

/** Confirms a started download and asks for a GitHub star in its place. */
export function DesktopDownloadNotice({
  copy,
  starHref,
}: {
  copy: DesktopGuideCopy["downloadNotice"];
  starHref: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(DOWNLOAD_EVENT, show);
    return () => window.removeEventListener(DOWNLOAD_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // The live region stays mounted so screen readers announce the notice.
  return (
    <div className="mac-download-region" role="status" aria-live="polite">
      {open ? (
        <div className="mac-download-notice">
          <CircleCheck className="mac-download-check" aria-hidden="true" strokeWidth={2} />
          <div className="mac-download-copy">
            <strong>{copy.title}</strong>
            <p>{copy.body}</p>
            <a
              href={starHref}
              target="_blank"
              rel="noreferrer"
              className="mac-download-star"
              onClick={() => track("github_star_click", { placement: "desktop_download" })}
            >
              <FaGithub aria-hidden="true" />
              {copy.starCta}
            </a>
          </div>
          <button
            type="button"
            className="mac-download-close"
            aria-label={copy.close}
            onClick={() => setOpen(false)}
          >
            <X aria-hidden="true" strokeWidth={2} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
