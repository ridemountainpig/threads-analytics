"use client";

import { useRef, type MouseEvent } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { csvExportFilename } from "@/lib/csv-export";
import { isDesktopApp } from "@/lib/runtime-target";

interface NativeSdkBridge {
  dialogs: {
    saveFile(options: { title?: string; defaultName?: string }): Promise<string | null>;
  };
}

function nativeBridge(): NativeSdkBridge | undefined {
  if (!isDesktopApp) return undefined;
  return (window as Window & { zero?: NativeSdkBridge }).zero;
}

export default function ExportCsvButton({
  href,
  labels,
}: {
  href: string;
  labels: { exportCsv: string; exportSaved: string; exportFailed: string };
}) {
  const savingRef = useRef(false);

  // WKWebView renders attachments inline instead of downloading them.
  const saveWithNativeDialog = async (event: MouseEvent<HTMLAnchorElement>) => {
    const bridge = nativeBridge();
    if (!bridge) return;
    event.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const target = await bridge.dialogs.saveFile({ defaultName: csvExportFilename() });
      if (!target) return;
      const res = await fetch(href, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-desktop-export": "1" },
        body: JSON.stringify({ path: target }),
      });
      const data: { path?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.path) throw new Error(data.error ?? `HTTP ${res.status}`);
      toast.success(labels.exportSaved.replace("{file}", data.path.split("/").pop() ?? ""));
    } catch (error) {
      toast.error(`${labels.exportFailed} ${error instanceof Error ? error.message : ""}`.trim());
    } finally {
      savingRef.current = false;
    }
  };

  return (
    <a
      href={href}
      onClick={saveWithNativeDialog}
      className="bg-muted/70 text-foreground hover:bg-muted flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-[background-color,transform] duration-150 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      <Download className="size-3.5" />
      {labels.exportCsv}
    </a>
  );
}
