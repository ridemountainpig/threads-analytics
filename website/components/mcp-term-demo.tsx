"use client";

import { useEffect, useRef, useState } from "react";

const MCP_CMD = "/mcp";

// Looping terminal replay: type the add command, type /mcp, show the
// connected line, hold, repeat. Reduced motion renders the finished state.
// The loop only runs while the terminal is actually in view — an unwatched
// replay is pure re-render churn.
export function McpTermDemo({ command }: { command: string }) {
  const [cmd, setCmd] = useState(0);
  const [mcp, setMcp] = useState(-1);
  const [ok, setOk] = useState(false);
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
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (fn: () => void, ms: number) => {
      timer = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      schedule(() => {
        setCmd(command.length);
        setMcp(MCP_CMD.length);
        setOk(true);
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    const run = () => {
      setCmd(0);
      setMcp(-1);
      setOk(false);

      const typeCmd = (i: number) => {
        setCmd(i);
        if (i < command.length) schedule(() => typeCmd(i + 1), 22);
        else schedule(() => typeMcp(0), 700);
      };
      const typeMcp = (j: number) => {
        setMcp(j);
        if (j < MCP_CMD.length) schedule(() => typeMcp(j + 1), 110);
        else schedule(finish, 650);
      };
      const finish = () => {
        setOk(true);
        schedule(run, 4400);
      };

      schedule(() => typeCmd(1), 300);
    };

    schedule(run, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [command, inView]);

  return (
    <div className="mcp-term-body" ref={rootRef}>
      <p>
        <span className="mcp-term-prompt">$</span>
        {command.slice(0, cmd)}
        {mcp < 0 && !ok && <span className="mcp-term-caret" />}
      </p>
      {mcp >= 0 && (
        <p>
          <span className="mcp-term-prompt">&gt;</span>
          {MCP_CMD.slice(0, mcp)}
          {!ok && <span className="mcp-term-caret" />}
        </p>
      )}
      {ok && <p className="mcp-term-ok">✓ threads-analytics · connected</p>}
    </div>
  );
}
