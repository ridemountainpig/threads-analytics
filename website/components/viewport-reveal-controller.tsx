"use client";

import { useEffect, useLayoutEffect } from "react";

const revealSelector = "[data-reveal]";
const pauseSelector = "[data-motion-pause]";

// useLayoutEffect on the client so the pre-reveal state applies before paint
// on client-side navigations; plain useEffect during SSR to avoid warnings.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ViewportRevealController() {
  useIsomorphicLayoutEffect(() => {
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      document.documentElement.classList.remove("js-reveal");
      return;
    }

    // Re-assert what the bootstrap script set on first load — switching
    // locale remounts <html>, which drops the class.
    document.documentElement.classList.add("js-reveal");

    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));

    if (revealTargets.length === 0) {
      return;
    }

    revealTargets.forEach((target) => target.classList.add("is-reveal-pending"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.remove("is-reveal-pending");
          entry.target.classList.add("is-reveal-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -5%", threshold: 0.12 },
    );

    revealTargets.forEach((target) => observer.observe(target));

    // Ambient loops (curve sparks, glows, pulses) burn paint forever if left
    // running off-screen; this observer keeps toggling — unlike the one-shot
    // reveal observer — so sections re-pause when scrolled away.
    const pauseTargets = Array.from(document.querySelectorAll<HTMLElement>(pauseSelector));

    const pauseObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-motion-paused", !entry.isIntersecting);
      });
    });

    pauseTargets.forEach((target) => pauseObserver.observe(target));

    return () => {
      observer.disconnect();
      pauseObserver.disconnect();
    };
  }, []);

  return null;
}
