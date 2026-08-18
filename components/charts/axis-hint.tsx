"use client";

interface AxisHintProps {
  x?: string;
  y?: string;
  size?: string;
  color?: string;
  columns?: string;
  rows?: string;
}

// A whisper-quiet mapping line ("X: Date · Y: Views") kept for orientation;
// set small and faint so the data stays the loudest thing on the card.
export default function AxisHint({ x, y, size, color, columns, rows }: AxisHintProps) {
  const items = [
    x ? `X: ${x}` : null,
    y ? `Y: ${y}` : null,
    size ? `Size: ${size}` : null,
    color ? `Color: ${color}` : null,
    columns ? `Columns: ${columns}` : null,
    rows ? `Rows: ${rows}` : null,
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <p className="text-muted-foreground/70 mb-2 text-[10px] leading-4 tracking-[0.02em]">
      {items.join("  ·  ")}
    </p>
  );
}
