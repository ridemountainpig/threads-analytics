"use client";

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { Check, Monitor, Moon, SunMedium } from "lucide-react";
import { useDetailsDismiss } from "@/components/use-details-dismiss";
import { THEME_STORAGE_KEY, isTheme, themeColors, type Theme } from "@/lib/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const THEME_EVENT = "threads-analytics:theme";

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function syncThemeColor() {
  const color = themeColors[document.documentElement.classList.contains("dark") ? "dark" : "light"];
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    if (meta.getAttribute("content") !== color) meta.setAttribute("content", color);
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle(
    "dark",
    theme === "dark" || (theme === "system" && window.matchMedia(DARK_QUERY).matches),
  );
  syncThemeColor();
  window.dispatchEvent(new Event(THEME_EVENT));
}

// One cross-fade of the whole page instead of every element easing its own
// colours on its own timing.
function crossFade(update: () => void) {
  const swap = () => {
    const style = document.createElement("style");
    style.textContent = "*,*::before,*::after{transition:none!important}";
    document.head.append(style);
    update();
    void document.body.offsetHeight;
    style.remove();
  };
  if (!document.startViewTransition) return swap();
  // A skipped transition (a quick second switch, a hidden tab) still swaps.
  document.startViewTransition(swap).ready.catch(() => {});
}

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

function getSnapshot(): Theme {
  const theme = document.documentElement.dataset.theme;
  return isTheme(theme) ? theme : "system";
}

function getServerSnapshot(): Theme | null {
  return null;
}

/** Mounted once per page: keeps <html> in step with the stored choice. */
export function ThemeController() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Dev Strict Mode remounts reset <html>'s class.
  useLayoutEffect(() => {
    applyTheme(readStoredTheme());
  }, []);

  // Next remounts the theme-color tags on navigation.
  useEffect(() => {
    const observer = new MutationObserver(syncThemeColor);
    observer.observe(document.head, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => crossFade(() => applyTheme("system"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) crossFade(() => applyTheme(readStoredTheme()));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}

export type ThemeMenuCopy = { label: string } & Record<Theme, string>;

// macOS's Appearance order and glyphs, as in the dashboard's switcher.
const options = [
  { value: "system", Icon: Monitor },
  { value: "light", Icon: SunMedium },
  { value: "dark", Icon: Moon },
] as const;

/** One glyph for the current mode; the three choices live in its menu. */
export function ThemeMenu({ copy }: { copy: ThemeMenuCopy }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  useDetailsDismiss(menuRef);
  // Null until hydrated; the visible glyph and check come from CSS either way.
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const label = theme ? `${copy.label}: ${copy[theme]}` : copy.label;

  const select = (next: Theme) => {
    // The picked button disappears with the menu; keep focus on the trigger.
    menuRef.current?.removeAttribute("open");
    menuRef.current?.querySelector("summary")?.focus();
    if (next === getSnapshot()) return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
    crossFade(() => applyTheme(next));
  };

  return (
    <details className="theme-menu" ref={menuRef}>
      <summary aria-label={label} title={label}>
        {options.map(({ value, Icon }) => (
          <Icon
            key={value}
            className="theme-menu-glyph"
            data-value={value}
            aria-hidden="true"
            strokeWidth={1.8}
          />
        ))}
      </summary>
      <div className="theme-menu-popover">
        {options.map(({ value, Icon }) => (
          <button
            key={value}
            type="button"
            data-value={value}
            aria-pressed={theme === null ? undefined : theme === value}
            onClick={() => select(value)}
          >
            <Check className="theme-menu-check" aria-hidden="true" strokeWidth={2.2} />
            <Icon className="theme-menu-icon" aria-hidden="true" strokeWidth={1.8} />
            {copy[value]}
          </button>
        ))}
      </div>
    </details>
  );
}
