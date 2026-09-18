"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

// Segmented control: a recessed track with the selected segment raised on a
// single background-colored pill that glides to the selection instead of each
// button painting its own background. Feedback lands on press (active:scale)
// rather than on release; reduced motion snaps the pill.
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<SegmentedOption<T>>;
  className?: string;
  label?: string;
}) {
  const buttonRefs = useRef(new Map<T, HTMLButtonElement>());
  const [pill, setPill] = useState<{ x: number; width: number } | null>(null);

  // Measured after layout, and re-measured when labels change size (locale switch).
  useLayoutEffect(() => {
    const button = buttonRefs.current.get(value);
    if (button) setPill({ x: button.offsetLeft, width: button.offsetWidth });
  }, [value, options]);

  // Radio-group contract: one tab stop, arrow keys move the selection.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = options.findIndex((option) => option.value === value);
    if (index < 0) return;
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : event.key === "Home"
            ? -index
            : event.key === "End"
              ? options.length - 1 - index
              : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = options[(index + step + options.length) % options.length]!;
    onChange(next.value);
    buttonRefs.current.get(next.value)?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("bg-muted/70 relative inline-flex items-center rounded-full p-0.5", className)}
    >
      {pill && (
        <span
          aria-hidden
          className="bg-background ring-foreground/5 absolute inset-y-0.5 left-0 rounded-full shadow-sm ring-1 transition-[translate,width] duration-200 ease-out motion-reduce:transition-none"
          style={{ translate: `${pill.x}px 0`, width: pill.width }}
        />
      )}
      {options.map((option) => (
        <button
          key={option.value}
          ref={(node) => {
            if (node) buttonRefs.current.set(option.value, node);
            else buttonRefs.current.delete(option.value);
          }}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          tabIndex={value === option.value ? 0 : -1}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative inline-flex h-6 items-center rounded-full px-2.5 text-[11px] transition-[color,transform] duration-200 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100",
            value === option.value
              ? "text-foreground font-medium"
              : "text-foreground/70 hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
