"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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
    if (el && !open) setClamped(el.scrollHeight > el.clientHeight + 1);
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
