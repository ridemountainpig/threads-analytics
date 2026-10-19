"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

// Heat-map cells: hover, focus and tap share one tooltip; arrow keys rove the grid.

interface Anchor {
  x: number;
  top: number;
  bottom: number;
}

function anchorOf(el: Element): Anchor {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, top: rect.top, bottom: rect.bottom };
}

const ARROW_STEPS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

export function useCellTooltip<T>(keys: string[]) {
  const [tip, setTip] = useState<{ data: T; anchor: Anchor } | null>(null);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const focusedRef = useRef<{ el: HTMLElement; data: T } | null>(null);
  const open = tip !== null;
  const tabStop = focusedKey !== null && keys.includes(focusedKey) ? focusedKey : keys[0];

  const show = useCallback((el: HTMLElement, data: T) => {
    anchorRef.current = el;
    setTip({ data, anchor: anchorOf(el) });
  }, []);
  const hide = useCallback(() => {
    anchorRef.current = null;
    setTip(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => {
      const el = anchorRef.current;
      // Arrowing to an off-screen cell scrolls its container; keep the tip on it.
      if (el && el === document.activeElement && el.matches(":focus-visible")) {
        setTip((current) => current && { ...current, anchor: anchorOf(el) });
      } else {
        hide();
      }
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // The first Escape closes the tooltip, not an enclosing dialog.
      event.stopPropagation();
      hide();
    };
    // A tap on another cell hides this tip; that cell's own click then shows its own.
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node && anchorRef.current?.contains(event.target))) hide();
    };
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("pointerdown", onPointerDown, { capture: true });
    };
  }, [open, hide]);

  const cellProps = (
    data: T,
    { key, row, col, label }: { key: string; row: number; col: number; label: string },
  ) => ({
    type: "button" as const,
    "data-chart-cell": "",
    "data-row": row,
    "data-col": col,
    "aria-label": label,
    tabIndex: key === tabStop ? 0 : -1,
    onMouseEnter: (event: { currentTarget: HTMLElement }) => show(event.currentTarget, data),
    // The tip goes back to a keyboard-focused cell rather than vanishing from it.
    onMouseLeave: () => {
      const focused = focusedRef.current;
      if (focused?.el.matches(":focus-visible")) show(focused.el, focused.data);
      else hide();
    },
    onFocus: (event: { currentTarget: HTMLElement }) => {
      setFocusedKey(key);
      focusedRef.current = { el: event.currentTarget, data };
      show(event.currentTarget, data);
    },
    onBlur: () => {
      focusedRef.current = null;
      hide();
    },
    onClick: (event: { currentTarget: HTMLElement }) => show(event.currentTarget, data),
  });

  const onGridKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const step = ARROW_STEPS[event.key];
    const cell = event.target instanceof HTMLElement ? event.target : null;
    if (!step || !cell?.hasAttribute("data-chart-cell")) return;
    event.preventDefault();
    const cells = event.currentTarget.querySelectorAll<HTMLElement>("[data-chart-cell]");
    let maxRow = 0;
    let maxCol = 0;
    for (const c of cells) {
      maxRow = Math.max(maxRow, Number(c.dataset.row));
      maxCol = Math.max(maxCol, Number(c.dataset.col));
    }
    let row = Number(cell.dataset.row) + step[0];
    let col = Number(cell.dataset.col) + step[1];
    while (row >= 0 && col >= 0 && row <= maxRow && col <= maxCol) {
      const next = event.currentTarget.querySelector<HTMLElement>(
        `[data-chart-cell][data-row="${row}"][data-col="${col}"]`,
      );
      if (next) {
        next.focus();
        return;
      }
      row += step[0];
      col += step[1];
    }
  };

  return { tip, cellProps, onGridKeyDown };
}

// Above the cell (below when there's no room), kept inside the viewport.
// Hidden from assistive tech: the cell's aria-label already says the value.
export function CellTooltip({ anchor, children }: { anchor: Anchor; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const margin = 8;
    const left = Math.min(
      Math.max(anchor.x - width / 2, margin),
      window.innerWidth - width - margin,
    );
    const above = anchor.top - height - margin;
    el.style.left = `${left}px`;
    el.style.top = `${above >= margin ? above : anchor.bottom + margin}px`;
    el.style.visibility = "visible";
  }, [anchor]);

  return createPortal(
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-50"
      style={{ visibility: "hidden" }}
    >
      {children}
    </div>,
    document.body,
  );
}
