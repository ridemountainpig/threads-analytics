import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  className?: string;
}

const VIEW_W = 100;
const VIEW_H = 28;

// Stretched to the card width; non-scaling strokes keep the line 1.5px at any aspect ratio.
export function Sparkline({ values, className }: SparklineProps) {
  const points = values.filter((v) => Number.isFinite(v));
  if (points.length < 2) return null;

  const pad = 2;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const stepX = VIEW_W / (points.length - 1);
  const coords = points.map((v, i) => {
    const x = i * stepX;
    const y = pad + (1 - (v - min) / span) * (VIEW_H - pad * 2);
    return [x, y] as const;
  });
  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${VIEW_W} ${VIEW_H} L0 ${VIEW_H} Z`;
  const [endX, endY] = coords[coords.length - 1]!;

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      className={cn("sparkline-reveal text-foreground/70 h-7 w-full overflow-visible", className)}
    >
      <path d={area} fill="currentColor" opacity={0.08} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Zero-length round-capped stroke: a <circle> would squash under the non-uniform scale. */}
      <path
        d={`M${endX.toFixed(2)} ${endY.toFixed(2)} l0.001 0`}
        stroke="currentColor"
        strokeWidth={4.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
