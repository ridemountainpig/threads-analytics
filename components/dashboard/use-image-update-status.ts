"use client";

import { useEffect, useState } from "react";
// Type-only import: erased at build time, so the server-only guard never fires.
import type { ImageUpdateStatusPayload } from "@/lib/image-update";

export type { ImageUpdateStatusPayload };

// The banner (layout) and the settings About card can mount on the same page
// view; sharing one module-level promise keeps that to a single request. The
// server caches the underlying GHCR check, so there is no point refetching
// within a page's lifetime either.
let statusRequest: Promise<ImageUpdateStatusPayload> | null = null;

function fetchImageUpdateStatus(): Promise<ImageUpdateStatusPayload> {
  statusRequest ??= fetch("/api/status/update", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`status ${response.status}`);
      return response.json() as Promise<ImageUpdateStatusPayload>;
    })
    .catch((error) => {
      // Let the next mount retry instead of caching the failure forever.
      statusRequest = null;
      throw error;
    });
  return statusRequest;
}

export function useImageUpdateStatus(enabled = true) {
  const [status, setStatus] = useState<ImageUpdateStatusPayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;

    fetchImageUpdateStatus()
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
