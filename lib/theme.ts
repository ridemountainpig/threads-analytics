export const THEME_COOKIE = "threads_analytics_theme";
export const themes = ["system", "light", "dark"] as const;

export type Theme = (typeof themes)[number];

export function isTheme(value: string | undefined | null): value is Theme {
  return value === "system" || value === "light" || value === "dark";
}

// Browser chrome (Safari's toolbar, the iOS status bar) matches the page background.
export const themeColors = { light: "#ffffff", dark: "#000000" } as const;

// Runs in <head> before the first paint. The server already knows an explicit
// choice; only "system" has to ask the browser.
export function themeScript(theme: Theme) {
  const dark =
    theme === "system"
      ? 'matchMedia("(prefers-color-scheme: dark)").matches'
      : String(theme === "dark");
  return `document.documentElement.classList.toggle("dark",${dark})`;
}
