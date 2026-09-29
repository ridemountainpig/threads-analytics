"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 15_000;

interface SyncStatusResponse {
  isConfigured: boolean;
  lastSyncedAt?: string | null;
}

export default function SyncStatusRefresher({
  initialLastSyncedAt,
}: {
  initialLastSyncedAt: string | null;
}) {
  const router = useRouter();
  const lastSyncedAtRef = useRef(initialLastSyncedAt);

  useEffect(() => {
    lastSyncedAtRef.current = initialLastSyncedAt;
  }, [initialLastSyncedAt]);

  useEffect(() => {
    let disposed = false;
    let checking = false;

    async function checkForCompletedSync() {
      if (checking || document.visibilityState === "hidden") return;
      checking = true;

      try {
        const response = await fetch("/api/status", { cache: "no-store" });
        if (!response.ok) return;

        const status = (await response.json()) as SyncStatusResponse;
        const lastSyncedAt = status.isConfigured ? (status.lastSyncedAt ?? null) : null;

        if (disposed || lastSyncedAt === lastSyncedAtRef.current) return;

        lastSyncedAtRef.current = lastSyncedAt;
        router.refresh();
      } catch {
        // A temporary status request failure should not interrupt the dashboard.
      } finally {
        checking = false;
      }
    }

    function checkWhenVisible() {
      if (document.visibilityState === "visible") void checkForCompletedSync();
    }

    void checkForCompletedSync();
    const intervalId = window.setInterval(() => void checkForCompletedSync(), POLL_INTERVAL_MS);
    window.addEventListener("focus", checkWhenVisible);
    document.addEventListener("visibilitychange", checkWhenVisible);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", checkWhenVisible);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, [router]);

  return null;
}
