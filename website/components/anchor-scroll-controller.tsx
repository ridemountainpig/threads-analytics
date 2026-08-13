"use client";

import { useEffect } from "react";

// Keep in sync with `scroll-padding-top` in app/globals.css — the gap left
// above an in-page anchor so it clears the sticky header.
const HEADER_OFFSET = 84;

// The marketing sections above the deploy anchor use `content-visibility: auto`
// (`.render-deferred`), so while they are off-screen the browser lays them out
// at their `contain-intrinsic-size` estimate rather than their real height. A
// native hash jump computes the target from those estimates, so it lands off —
// usually past the section heading, deep into the deploy cards.
//
// We leave the native jump in place (so scrolling always works) and only nudge
// the residual drift away once the real heights are laid out: after the jump
// settles, re-measure the target and, if it isn't sitting at HEADER_OFFSET,
// smooth-scroll the small remaining distance.
export function AnchorScrollController() {
  useEffect(() => {
    const desiredTop = (target: HTMLElement) =>
      Math.max(0, target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET);

    const correctAfterSettle = (id: string) => {
      const target = document.getElementById(id);
      if (!target) return;

      let stableFrames = 0;
      let lastY = Number.NaN;
      let frames = 0;

      const tick = () => {
        const y = Math.round(window.scrollY);
        if (y === lastY) stableFrames += 1;
        else {
          stableFrames = 0;
          lastY = y;
        }
        frames += 1;

        // Wait until the native scroll has stopped moving (or bail after a
        // generous ceiling so we never spin forever).
        if (stableFrames < 6 && frames < 180) {
          requestAnimationFrame(tick);
          return;
        }

        const top = desiredTop(target);
        if (Math.abs(top - window.scrollY) > 2) {
          const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
        }
      };

      requestAnimationFrame(tick);
    };

    const onHashChange = () => {
      if (window.location.hash.length > 1) {
        correctAfterSettle(decodeURIComponent(window.location.hash.slice(1)));
      }
    };

    window.addEventListener("hashchange", onHashChange);

    // A page loaded (or hard-reloaded) with a hash jumps using the same wrong
    // estimates, so correct that landing too.
    if (window.location.hash.length > 1) {
      correctAfterSettle(decodeURIComponent(window.location.hash.slice(1)));
    }

    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}
