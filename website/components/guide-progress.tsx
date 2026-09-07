"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

type GuideProgressPhase = {
  index: string;
  range: string;
  title: string;
};

// Sticky table of contents for the token guide's step flow. Tracks which
// phase section is closest to the reading line and marks earlier phases as
// done, so the 18-step page always shows where the reader is.
export function GuideProgress({
  label,
  stepsLabel,
  phases,
}: {
  label: string;
  stepsLabel: string;
  phases: GuideProgressPhase[];
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ids = phases.map((_, i) => `phase-${i + 1}`);
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (targets.length === 0) {
      return;
    }

    // Reading line at 35% of the viewport, expressed as rootMargin so the
    // browser tracks crossings off the main thread — no per-scroll layout
    // reads. A heading counts as passed once its top is above that line.
    const passed = new Map<string, boolean>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const line = entry.rootBounds ? entry.rootBounds.top : window.innerHeight * 0.35;
          passed.set(entry.target.id, entry.boundingClientRect.top <= line);
        });

        let current = 0;
        ids.forEach((id, i) => {
          if (passed.get(id)) {
            current = i;
          }
        });
        setActive(current);
      },
      { rootMargin: "-35% 0px -65% 0px" },
    );

    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [phases]);

  return (
    <nav className="guide-progress" aria-label={label}>
      <p className="guide-progress-label">{label}</p>
      <ol className="guide-progress-list">
        {phases.map((phase, i) => {
          const state = i === active ? "is-active" : i < active ? "is-done" : undefined;
          return (
            <li key={phase.index}>
              <a href={`#phase-${i + 1}`} className={state}>
                {/* Digit and check stay stacked so the done state crossfades
                    instead of swapping glyphs in a hard cut. */}
                <span className="guide-progress-index" aria-hidden="true">
                  <span className="guide-progress-glyph guide-progress-num">{phase.index}</span>
                  <span className="guide-progress-glyph guide-progress-check">
                    <Check strokeWidth={2.6} />
                  </span>
                </span>
                <span className="guide-progress-text">
                  <strong>{phase.title}</strong>
                  <span>
                    {stepsLabel} {phase.range}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
