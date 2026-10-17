"use client";

import { useCallback, useSyncExternalStore } from "react";

// A chart control's last pick, in localStorage and shared live by the card and
// its expanded copy. Hydration renders the server's null; a copy mounted later
// (the dialog) reads the pick on its first render, so it never flashes the default.
const listeners = new Set<() => void>();
// Session fallback when storage is blocked, so the pick still carries over.
const memory = new Map<string, string>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function read(key: string): string | null {
  const remembered = memory.get(key);
  if (remembered !== undefined) return remembered;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function useStoredChoice<T extends string>(
  key: string,
  parse: (value: string | null) => T | null,
): [T | null, (next: T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const store = useCallback(
    (next: T) => {
      memory.set(key, next);
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Persisting is best-effort; the session copy above still applies.
      }
      listeners.forEach((listener) => listener());
    },
    [key],
  );
  return [parse(raw), store];
}
