"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function CopyButton({
  value,
  labels,
}: {
  value: string;
  labels: { copy: string; copied: string; failed?: string };
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      if (labels.failed) toast.error(labels.failed);
      return;
    }
    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={copy}
      aria-label={copied ? labels.copied : labels.copy}
      title={copied ? labels.copied : labels.copy}
      // The ::after layer stretches the 28px button to a 44px tap target.
      className="relative after:absolute after:-inset-2"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  );
}
