"use client";

import { useTheme } from "@/components/theme-provider";
import { themes, type Theme } from "@/lib/theme";

interface AppearancePickerProps {
  labels: { title: string; system: string; light: string; dark: string };
}

// Each thumbnail paints its own theme's colors, whatever the current one is.
const sceneColors = {
  light: {
    background: "#ffffff",
    sidebar: "#f5f5f7",
    rule: "#e5e5ea",
    selected: "#e5e5ea",
    fill: "#d1d1d6",
    card: "#ffffff",
    cardEdge: "#e5e5ea",
    tint: "oklch(0.55 0.16 252)",
  },
  dark: {
    background: "#000000",
    sidebar: "#1c1c1e",
    rule: "#2c2c2e",
    selected: "#3a3a3c",
    fill: "#48484a",
    card: "#1c1c1e",
    cardEdge: "none",
    tint: "#409cff",
  },
};

function Scene({ colors }: { colors: (typeof sceneColors)["light" | "dark"] }) {
  return (
    <>
      <rect width="160" height="100" fill={colors.background} />
      <rect width="44" height="100" fill={colors.sidebar} />
      <rect x="44" width="1" height="100" fill={colors.rule} />
      <rect x="6" y="10" width="32" height="8" rx="3" fill={colors.selected} />
      <rect x="10" y="26" width="22" height="4" rx="2" fill={colors.fill} />
      <rect x="10" y="36" width="18" height="4" rx="2" fill={colors.fill} />
      <rect x="10" y="46" width="24" height="4" rx="2" fill={colors.fill} />
      <rect
        x="54.5"
        y="10.5"
        width="95"
        height="44"
        rx="6"
        fill={colors.card}
        stroke={colors.cardEdge}
      />
      <polyline
        points="63,45 77,37 90,40 104,27 118,31 131,20 141,24"
        fill="none"
        stroke={colors.tint}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[54.5, 104.5].map((x) => (
        <g key={x}>
          <rect
            x={x}
            y="62.5"
            width="45"
            height="28"
            rx="6"
            fill={colors.card}
            stroke={colors.cardEdge}
          />
          <rect x={x + 6.5} y="70" width="16" height="4" rx="2" fill={colors.fill} />
          <rect x={x + 6.5} y="78" width="26" height="6" rx="2" fill={colors.fill} />
        </g>
      ))}
    </>
  );
}

function Preview({ theme }: { theme: Theme }) {
  return (
    <svg viewBox="0 0 160 100" className="block h-auto w-full" aria-hidden>
      <Scene colors={sceneColors[theme === "dark" ? "dark" : "light"]} />
      {/* Auto splits down the middle, like the macOS thumbnail. */}
      {theme === "system" && (
        <svg x="80" width="80" height="100" viewBox="80 0 80 100">
          <Scene colors={sceneColors.dark} />
        </svg>
      )}
    </svg>
  );
}

export default function AppearancePicker({ labels }: AppearancePickerProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div role="radiogroup" aria-label={labels.title} className="grid max-w-md grid-cols-3 gap-3">
      {themes.map((value) => (
        <label key={value} className="group flex cursor-pointer flex-col items-center gap-2">
          <input
            type="radio"
            name="appearance"
            value={value}
            checked={theme === value}
            onChange={() => setTheme(value)}
            className="peer sr-only"
          />
          <span className="ring-foreground/10 ring-offset-card peer-checked:ring-tint peer-focus-visible:outline-ring/60 block w-full overflow-hidden rounded-lg ring-1 transition-transform duration-150 group-active:scale-[0.97] peer-checked:ring-2 peer-checked:ring-offset-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 motion-reduce:transition-none motion-reduce:group-active:scale-100">
            <Preview theme={value} />
          </span>
          <span className="text-muted-foreground peer-checked:text-foreground text-xs peer-checked:font-medium">
            {labels[value]}
          </span>
        </label>
      ))}
    </div>
  );
}
