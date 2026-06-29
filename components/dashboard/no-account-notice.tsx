import Link from "next/link";
import { ArrowRight, Unplug } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface NoAccountNoticeProps {
  message: string;
  /** Help text with a "{settings}" placeholder, e.g. "Go to {settings} to add your account." */
  help: string;
  settingsLabel: string;
}

export function NoAccountNotice({ message, help, settingsLabel }: NoAccountNoticeProps) {
  // The Settings CTA is the button below, so the placeholder collapses to plain text here.
  const helpText = help.replace("{settings}", settingsLabel);
  // `noAccount` ends with sentence punctuation for inline use; drop it for the heading.
  const heading = message.replace(/[。．.!！]+\s*$/, "");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="relative size-14">
        <div className="bg-muted absolute inset-0 rotate-6 rounded-2xl" />
        <div className="ring-border bg-card absolute inset-0 flex items-center justify-center rounded-2xl ring-1">
          <Unplug className="text-muted-foreground size-6" />
        </div>
      </div>
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-medium">{heading}</h2>
        <p className="text-muted-foreground mx-auto max-w-xs text-sm text-balance">{helpText}</p>
      </div>
      <Link href="/dashboard/settings" className={buttonVariants({ size: "lg" })}>
        {settingsLabel}
        <ArrowRight data-icon="inline-end" />
      </Link>
    </div>
  );
}
