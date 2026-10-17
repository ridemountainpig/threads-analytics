"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Both buttons lock as soon as either submits; only the pressed one spins.
export default function ConsentButton({
  formAction,
  variant,
  children,
}: {
  formAction: (formData: FormData) => Promise<void>;
  variant?: "default" | "outline";
  children: ReactNode;
}) {
  const { pending, action } = useFormStatus();
  const active = pending && action === formAction;

  return (
    <Button
      type="submit"
      variant={variant}
      formAction={formAction}
      disabled={pending}
      className="flex-1 rounded-full max-md:h-10"
    >
      {active && <Loader2 className="animate-spin motion-reduce:animate-none" />}
      {children}
    </Button>
  );
}
