"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// A resize, rotation or late web font can change whether a text overflows. One
// observer and one font listener serve every instance; the inbox renders one per reply.
const measures = new Map<Element, () => void>();
let resizeObserver: ResizeObserver | undefined;
const measureAll = () => measures.forEach((measure) => measure());

function watchOverflow(el: Element, measure: () => void) {
  resizeObserver ??= new ResizeObserver((entries) => {
    for (const entry of entries) measures.get(entry.target)?.();
  });
  if (measures.size === 0) document.fonts.addEventListener("loadingdone", measureAll);
  measures.set(el, measure);
  resizeObserver.observe(el);
  return () => {
    resizeObserver?.unobserve(el);
    measures.delete(el);
    if (measures.size === 0) document.fonts.removeEventListener("loadingdone", measureAll);
  };
}

export default function ExpandableText({
  text,
  className,
  labels,
}: {
  text: string;
  className?: string;
  labels: { more: string; less: string };
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    return watchOverflow(el, measure);
  }, [text, open]);

  return (
    <div className="space-y-1">
      <p
        ref={ref}
        className={cn("break-words whitespace-pre-line", !open && "line-clamp-4", className)}
      >
        {text}
      </p>
      {(clamped || open) && (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="text-tint -my-2.5 inline-flex min-h-11 items-center text-sm transition-opacity duration-150 hover:opacity-80 active:opacity-60 motion-reduce:transition-none"
        >
          {open ? labels.less : labels.more}
        </button>
      )}
    </div>
  );
}
