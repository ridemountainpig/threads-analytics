"use client";

import { useEffect, useLayoutEffect } from "react";

const revealSelector = "[data-reveal]";

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

    return () => observer.disconnect();
  }, []);

  return null;
}
