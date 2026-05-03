"use client";

import { useEffect } from "react";

export default function TimezoneSyncer() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `tz=${encodeURIComponent(tz)};path=/;max-age=31536000;samesite=strict`;
  }, []);
  return null;
}
