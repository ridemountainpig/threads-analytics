"use client";

interface AxisHintProps {
  x?: string;
  y?: string;
}

// A quiet mapping line ("X: Date · Y: Views") kept for orientation; size and
// color encodings are left to each chart's legend or subtitle.
export default function AxisHint({ x, y }: AxisHintProps) {
  const items = [x ? `X: ${x}` : null, y ? `Y: ${y}` : null].filter(Boolean);

  if (!items.length) return null;

  return (
    <p className="text-muted-foreground mb-2 text-[10px] leading-4 tracking-[0.02em]">
      {items.join("  ·  ")}
    </p>
  );
}
