"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TimezoneSyncer() {
  const router = useRouter();

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const savedCookie = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("tz="))
      ?.slice(3);
    let savedTz: string | null = null;
    try {
      savedTz = savedCookie ? decodeURIComponent(savedCookie) : null;
    } catch {
      // Replace malformed values below.
    }

    if (savedTz === tz) return;

    document.cookie = `tz=${encodeURIComponent(tz)};path=/;max-age=31536000;samesite=strict`;
    router.refresh();
  }, [router]);

  return null;
}
