"use client";

import { useEffect, useState } from "react";
import type { UpdateStatusPayload } from "@/lib/update-status";

export type { UpdateStatusPayload };

// The banner (layout), the sidebar version link, and the settings About card
// can mount on the same page view; sharing one module-level promise keeps
// that to a single request. The server caches the underlying check, so there
// is no point refetching within a page's lifetime either.
let statusRequest: Promise<UpdateStatusPayload> | null = null;

function fetchUpdateStatus(): Promise<UpdateStatusPayload> {
  statusRequest ??= fetch("/api/status/update", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`status ${response.status}`);
      return response.json() as Promise<UpdateStatusPayload>;
    })
    .catch((error) => {
      // Let the next mount retry instead of caching the failure forever.
      statusRequest = null;
      throw error;
    });
  return statusRequest;
}

export function useUpdateStatus(enabled = true) {
  const [status, setStatus] = useState<UpdateStatusPayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;

    fetchUpdateStatus()
      .then((result) => {
        if (!disposed) setStatus(result);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });

    return () => {
      disposed = true;
    };
  }, [enabled]);

  return { status, failed };
}
