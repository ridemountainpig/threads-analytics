"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Gift, Loader2, Ticket, Trophy } from "lucide-react";
import type { Dictionary, GiveawayConditionId } from "@/lib/i18n";

type Panel = Dictionary["giveawayGuide"]["demo"]["panel"];
type Entry = Panel["entries"][number];

const REQUIRED_MENTIONS = 2;

// Same draw the dashboard runs: Fisher–Yates over the browser's cryptographic
// RNG, so the demo isn't a friendlier shuffle than the real thing.
function secureShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  const rand = new Uint32Array(arr.length);
  crypto.getRandomValues(rand);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (rand[i] as number) % (i + 1);
    [arr[i], arr[j]] = [arr[j] as T, arr[i] as T];
  }
  return arr;
}

/** First condition that rejects the entry, or null when it stays in the pool. */
function rejectionReason(
  entry: Entry,
  active: Record<GiveawayConditionId, boolean>,
  survivors: Set<string>,
): GiveawayConditionId | null {
  if (active.keyword && !entry.keyword) return "keyword";
  if (active.mentions && entry.mentions < REQUIRED_MENTIONS) return "mentions";
  if (active.deadline && entry.late) return "deadline";
  // Dedupe runs last so it only drops replies that already passed the rest.
  if (active.dedupe && survivors.has(entry.user)) return "dedupe";
  return null;
}

export function GiveawayDrawDemo({ copy }: { copy: Dictionary["giveawayGuide"]["demo"] }) {
  const panel = copy.panel;
  const [active, setActive] = useState<Record<GiveawayConditionId, boolean>>({
    dedupe: true,
    keyword: true,
    mentions: false,
    deadline: false,
  });
  const [drawing, setDrawing] = useState(false);
  const [results, setResults] = useState<{ prize: string; winners: string[] }[] | null>(null);
  const [pool, setPool] = useState(0);
  const drawTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (drawTimer.current) clearTimeout(drawTimer.current);
    };
  }, []);

  const rows = useMemo(() => {
    const survivors = new Set<string>();
    return panel.entries.map((entry) => {
      const reason = rejectionReason(entry, active, survivors);
      if (!reason) survivors.add(entry.user);
      return { entry, reason };
    });
  }, [panel.entries, active]);

  const eligible = rows.filter((row) => !row.reason);
  const filtered = rows.length - eligible.length;
  const prizeTotal = panel.prizes.reduce((sum, prize) => sum + prize.count, 0);

  function toggle(id: GiveawayConditionId) {
    setActive((prev) => ({ ...prev, [id]: !prev[id] }));
    // Results drawn under the old rules would no longer match the list.
    setResults(null);
  }

  function draw() {
    if (drawing || eligible.length === 0) return;
    setDrawing(true);
    setResults(null);
    if (drawTimer.current) clearTimeout(drawTimer.current);
    drawTimer.current = setTimeout(() => {
      const shuffled = secureShuffle(eligible.map((row) => row.entry.user));
      let cursor = 0;
      const drawn = panel.prizes.map((prize) => ({
        prize: prize.name,
        winners: shuffled.slice(cursor, (cursor += prize.count)),
      }));
      setPool(eligible.length);
      setResults(drawn);
      setDrawing(false);
    }, 900);
  }

  return (
    <div className="giveaway-demo">
      <div className="giveaway-demo-setup">
        <section className="giveaway-demo-block">
          <h3 className="giveaway-demo-label">{panel.conditionsLabel}</h3>
          <ul className="giveaway-switch-list">
            {panel.conditions.map((condition) => (
              <li key={condition.id}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={active[condition.id]}
                  className={active[condition.id] ? "giveaway-switch is-on" : "giveaway-switch"}
                  onClick={() => toggle(condition.id)}
                >
                  <span className="giveaway-switch-track" aria-hidden="true">
                    <i />
                  </span>
                  <span className="giveaway-switch-copy">
                    <strong>{condition.label}</strong>
                    <small>{condition.hint}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="giveaway-demo-block">
          <h3 className="giveaway-demo-label">{panel.prizesLabel}</h3>
          <ul className="giveaway-prize-list">
            {panel.prizes.map((prize) => (
              <li key={prize.name}>
                <Gift aria-hidden="true" strokeWidth={1.9} />
                <span>{prize.name}</span>
                <b>× {prize.count}</b>
              </li>
            ))}
          </ul>
        </section>

        <button
          type="button"
          className="button button-primary giveaway-draw-button"
          onClick={draw}
          disabled={drawing || eligible.length === 0}
        >
          {drawing ? (
            <>
              <Loader2 aria-hidden="true" className="agent-spinner" strokeWidth={2.2} />
              {panel.drawingLabel}
            </>
          ) : (
            <>
              {results ? panel.redrawLabel : panel.drawLabel}
              <span className="giveaway-draw-count">{prizeTotal}</span>
            </>
          )}
        </button>
      </div>

      <div className="giveaway-demo-pool">
        <div className="giveaway-pool-head">
          <span className="giveaway-demo-label">{panel.entriesLabel}</span>
          <span className="giveaway-pool-counts">
            <b>
              <Ticket aria-hidden="true" strokeWidth={2} />
              {eligible.length} {panel.eligibleLabel}
            </b>
            <i>
              {filtered} {panel.filteredLabel}
            </i>
          </span>
        </div>

        <div className="giveaway-results" role="status">
          {results ? (
            <>
              <div className="giveaway-results-list">
                {results.map((result) => (
                  <div key={result.prize} className="giveaway-results-prize">
                    <strong>
                      <Trophy aria-hidden="true" strokeWidth={2} />
                      {result.prize}
                    </strong>
                    <span>
                      {result.winners.map((winner) => (
                        <b key={winner}>@{winner}</b>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
              <p className="giveaway-results-summary">
                {panel.summary
                  .replace("{won}", String(results.reduce((n, r) => n + r.winners.length, 0)))
                  .replace("{pool}", String(pool))}
              </p>
            </>
          ) : (
            <p className="giveaway-results-empty">
              {panel.resultsLabel} · {panel.emptyLabel}
            </p>
          )}
        </div>

        <ul className="giveaway-entry-list">
          {rows.map(({ entry, reason }, index) => {
            const won = results?.some((result) => result.winners.includes(entry.user));
            return (
              <li
                key={`${entry.user}-${index}`}
                className={[
                  "giveaway-entry",
                  reason ? "is-filtered" : "",
                  won && !reason ? "is-winner" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="giveaway-entry-user">@{entry.user}</span>
                <span className="giveaway-entry-text">{entry.text}</span>
                {reason ? (
                  <code className="giveaway-entry-reason">{reason}</code>
                ) : won ? (
                  <span className="giveaway-entry-trophy" aria-hidden="true">
                    <Trophy strokeWidth={2.2} />
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
