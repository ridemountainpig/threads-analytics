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
    let ticking = false;

    const update = () => {
      ticking = false;
      // Reading line at 35% of the viewport: the phase whose heading last
      // crossed it is the one the reader is in.
      const line = window.innerHeight * 0.35;
      let current = 0;
      ids.forEach((id, i) => {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= line) {
          current = i;
        }
      });
      setActive(current);
    };

    const request = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);

    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
    };
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
                <span className="guide-progress-index" aria-hidden="true">
                  {i < active ? <Check strokeWidth={2.6} /> : phase.index}
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
