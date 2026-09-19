"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, Trophy } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

type ResultCard = Dictionary["giveawayGuide"]["hero"]["resultCard"];

// Handles the reel spins through while "shuffling" — deliberately not in the
// dictionary: they are @handles, identical in every locale.
const reelHandles = [
  "@sora.ui",
  "@kai.exe",
  "@noah.dev",
  "@ren.tech",
  "@yuki.md",
  "@theo.ships",
  "@ava.design",
  "@lila.dev",
];

// Looping winner reveal: the entries blur past, then each winner lands in
// turn. Used by the giveaway page hero and the homepage giveaway section.
export function GiveawayWinnersCard({ copy }: { copy: ResultCard }) {
  const totalWinners = copy.prizes.reduce((sum, prize) => sum + prize.winners.length, 0);
  const [run, setRun] = useState(0);
  const [shuffling, setShuffling] = useState(true);
  const [landed, setLanded] = useState(0);
  const [reel, setReel] = useState(0);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.25 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    let cancelled = false;
    let reelTimer: ReturnType<typeof setInterval> | null = null;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, ms: number) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) fn();
        }, ms),
      );
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // No shuffle theatre and no loop — land on the finished result.
      schedule(() => {
        setShuffling(false);
        setLanded(totalWinners);
      }, 0);
    } else {
      schedule(() => {
        setShuffling(true);
        setLanded(0);
        reelTimer = setInterval(() => setReel((value) => value + 1), 90);
      }, 0);
      schedule(() => {
        if (reelTimer) clearInterval(reelTimer);
        setShuffling(false);
      }, 1500);
      for (let i = 1; i <= totalWinners; i++) {
        schedule(() => setLanded(i), 1500 + i * 420);
      }
      schedule(() => setRun((value) => value + 1), 1500 + totalWinners * 420 + 5200);
    }

    return () => {
      cancelled = true;
      if (reelTimer) clearInterval(reelTimer);
      timers.forEach(clearTimeout);
    };
  }, [inView, run, totalWinners]);

  // Winners land one after another, so each needs its position across prizes.
  const prizeRows = copy.prizes.map((prize, index) => {
    const before = copy.prizes
      .slice(0, index)
      .reduce((sum, earlier) => sum + earlier.winners.length, 0);
    return {
      name: prize.name,
      winners: prize.winners.map((winner, slot) => ({ winner, slot: before + slot + 1 })),
    };
  });

  return (
    <div className="guide-check-card giveaway-result-card" ref={rootRef}>
      <div className="giveaway-result-head">
        <span className="agent-prompt-label">
          <Trophy aria-hidden="true" strokeWidth={2} />
          {copy.label}
        </span>
        <span className="giveaway-result-badge">{copy.badge}</span>
      </div>

      {shuffling ? (
        <div className="giveaway-result-shuffle" role="status">
          <span className="giveaway-shuffle-line">
            <Loader2 aria-hidden="true" className="agent-spinner" strokeWidth={2.2} />
            {copy.shuffling}
          </span>
          <span className="giveaway-shuffle-reel" aria-hidden="true">
            {[0, 1, 2].map((offset) => (
              <b key={offset}>{reelHandles[(reel + offset) % reelHandles.length]}</b>
            ))}
          </span>
        </div>
      ) : (
        <div className="giveaway-result-prizes">
          {prizeRows.map((prize) => (
            <div key={prize.name} className="giveaway-result-prize">
              <span className="giveaway-result-prize-name">{prize.name}</span>
              <span className="giveaway-result-winners">
                {prize.winners.map(({ winner, slot }) => (
                  <b key={winner} className={slot <= landed ? "is-landed" : undefined}>
                    {winner}
                  </b>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="giveaway-result-foot">
        <p className="guide-check-note">{copy.summary}</p>
        <button
          type="button"
          className="giveaway-result-replay"
          onClick={() => setRun((value) => value + 1)}
        >
          <RotateCcw aria-hidden="true" strokeWidth={2} />
          {copy.replay}
        </button>
      </div>
    </div>
  );
}
