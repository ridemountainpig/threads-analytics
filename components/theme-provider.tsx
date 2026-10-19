"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { THEME_COOKIE, themeColors, type Theme } from "@/lib/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void } | null>(null);

function syncThemeColor() {
  const color = themeColors[document.documentElement.classList.contains("dark") ? "dark" : "light"];
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    if (meta.getAttribute("content") !== color) meta.setAttribute("content", color);
  }
}

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia(DARK_QUERY).matches);
  document.documentElement.classList.toggle("dark", dark);
  syncThemeColor();
}

// A brightness jump eases in as one cross-fade of the whole page, rather than
// every element running its own color transition on its own timing.
function crossFade(update: () => void) {
  const swap = () => {
    const style = document.createElement("style");
    style.textContent = "*,*::before,*::after{transition:none!important}";
    document.head.append(style);
    update();
    // Layout settles every element's new colors while transitions are off.
    void document.body.offsetHeight;
    style.remove();
  };
  if (!document.startViewTransition) return swap();
  // A skipped transition (a quick second switch, a hidden tab) still swaps, just instantly.
  document.startViewTransition(swap).ready.catch(() => {});
}

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState(initialTheme);
  // The latest pick; `theme` only catches up inside the deferred cross-fade.
  const pickedTheme = useRef(initialTheme);

  // Next remounts the theme-color tags on every navigation, and a cached route
  // can bring back tags rendered before the last switch.
  useEffect(() => {
    const observer = new MutationObserver(syncThemeColor);
    observer.observe(document.head, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Also covers the dev Strict Mode remount, which resets <html>'s class.
  useLayoutEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => crossFade(() => applyTheme("system"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    if (next === pickedTheme.current) return;
    pickedTheme.current = next;
    document.cookie = `${THEME_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    crossFade(() => flushSync(() => setThemeState(next)));
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
