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
    // One settle loop at a time; user scroll input always wins over the
    // correction — a stale loop must never yank the page back.
    let rafId = 0;
    let cancelled = false;

    const desiredTop = (target: HTMLElement) =>
      Math.max(0, target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET);

    const cancelPending = () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };

    const onUserScroll = () => cancelPending();

    const correctAfterSettle = (id: string) => {
      const target = document.getElementById(id);
      if (!target) return;

      cancelPending();
      cancelled = false;

      let stableFrames = 0;
      let lastY = Number.NaN;
      let frames = 0;

      const tick = () => {
        if (cancelled) return;

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
          rafId = requestAnimationFrame(tick);
          return;
        }

        const top = desiredTop(target);
        if (Math.abs(top - window.scrollY) > 2) {
          const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    const onHashChange = () => {
      if (window.location.hash.length > 1) {
        correctAfterSettle(decodeURIComponent(window.location.hash.slice(1)));
      }
    };

    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchstart", onUserScroll, { passive: true });

    // A page loaded (or hard-reloaded) with a hash jumps using the same wrong
    // estimates, so correct that landing too.
    if (window.location.hash.length > 1) {
      correctAfterSettle(decodeURIComponent(window.location.hash.slice(1)));
    }

    return () => {
      cancelPending();
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchstart", onUserScroll);
    };
  }, []);

  return null;
}
