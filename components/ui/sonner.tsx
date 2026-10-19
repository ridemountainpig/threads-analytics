"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/components/theme-provider";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      // --toast-offset-bottom (globals.css) is set only while the mobile tab bar shows.
      offset={{ bottom: "var(--toast-offset-bottom, 24px)" }}
      mobileOffset={{ bottom: "var(--toast-offset-bottom, 16px)" }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          // Sonner's own button styles are unlayered, so overrides need `!`.
          actionButton:
            "bg-tint/12! hover:bg-tint/18! text-tint! h-7! rounded-full! px-3! font-medium!",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
