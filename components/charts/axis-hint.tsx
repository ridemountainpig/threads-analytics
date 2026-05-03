"use client";

interface AxisHintProps {
  x?: string;
  y?: string;
  size?: string;
  color?: string;
  columns?: string;
  rows?: string;
}

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

  return <p className="text-muted-foreground mb-2 text-[11px]">{items.join(" · ")}</p>;
}
