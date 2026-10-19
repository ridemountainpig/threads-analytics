export const THEME_STORAGE_KEY = "threads-analytics-theme";
export const themes = ["system", "light", "dark"] as const;

export type Theme = (typeof themes)[number];

export function isTheme(value: unknown): value is Theme {
  return value === "system" || value === "light" || value === "dark";
}

// Browser chrome (Safari's toolbar, the iOS status bar) matches --color-bg.
export const themeColors = { light: "#ffffff", dark: "#000000" } as const;

// Runs before first paint. Pages are statically rendered, so the choice lives
// in localStorage rather than a cookie, and the toggle draws its selected
// segment from html[data-theme] in CSS instead of from server markup.
export const themeBootstrap = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark")t="system";var d=document.documentElement;d.dataset.theme=t;d.classList.toggle("dark",t==="dark"||t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches)}catch(e){}`;
