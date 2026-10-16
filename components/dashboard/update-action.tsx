"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { UpdateStatusPayload } from "@/lib/update-status";
import { cn } from "@/lib/utils";

interface UpdateActionProps {
  status: UpdateStatusPayload;
  /** Labels with a "{version}" placeholder, e.g. "Download {version}". */
  labels: { install: string; download: string };
  size: "xs" | "sm";
}

// The button sizes pull the side padding in next to an inline-start icon;
// the rounded update button reads better with a little more room.
const paddingBySize = {
  xs: "px-2.5 has-data-[icon=inline-start]:pl-2",
  sm: "px-3 has-data-[icon=inline-start]:pl-2.5",
};

// The Native SDK host answers this command with its updater: it checks the
// signed feed (updates in desktop/app.json), asks to install, downloads and
// verifies the ZIP, replaces the app, and relaunches it.
const CHECK_FOR_UPDATES_COMMAND = "app.check-for-updates";

interface NativeSdkCommands {
  invoke(command: { name: string }): Promise<unknown>;
}

function nativeCommands(): NativeSdkCommands | undefined {
  return (window as Window & { zero?: { commands?: NativeSdkCommands } }).zero?.commands;
}

// Installs an available update in place when the desktop app can, otherwise
// links its ZIP. The link is a plain one, so the desktop app hands it to the
// system browser (external_links in desktop/app.json).
export function UpdateAction({ status, labels, size }: UpdateActionProps) {
  const [installFailed, setInstallFailed] = useState(false);
  const version = status.latest?.label;
  if (!status.updateAvailable || !version) return null;
  const className = cn(buttonVariants({ size }), "rounded-full", paddingBySize[size]);

  if (status.inAppInstall && !installFailed) {
    const install = async () => {
      try {
        const commands = nativeCommands();
        if (!commands) throw new Error("The Native SDK bridge is unavailable");
        await commands.invoke({ name: CHECK_FOR_UPDATES_COMMAND });
      } catch {
        // The manual download still works, and the update guide covers it.
        setInstallFailed(true);
      }
    };
    return (
      <button type="button" onClick={install} className={className}>
        <Download data-icon="inline-start" />
        {labels.install.replace("{version}", version)}
      </button>
    );
  }

  if (!status.download) return null;
  return (
    <a href={status.download} target="_blank" rel="noreferrer" className={className}>
      <Download data-icon="inline-start" />
      {labels.download.replace("{version}", version)}
    </a>
  );
}
