import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UpdateDownloadLinkProps {
  href: string;
  version: string;
  /** Label with a "{version}" placeholder, e.g. "Download {version}". */
  label: string;
  size: "xs" | "sm";
}

// The button sizes pull the side padding in next to an inline-start icon;
// the rounded download button reads better with a little more room.
const paddingBySize = {
  xs: "px-2.5 has-data-[icon=inline-start]:pl-2",
  sm: "px-3 has-data-[icon=inline-start]:pl-2.5",
};

// Direct download of an available update. A plain link, so the desktop app
// hands it to the system browser (external_links in desktop/app.json).
export function UpdateDownloadLink({ href, version, label, size }: UpdateDownloadLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(buttonVariants({ size }), "rounded-full", paddingBySize[size])}
    >
      <Download data-icon="inline-start" />
      {label.replace("{version}", version)}
    </a>
  );
}
