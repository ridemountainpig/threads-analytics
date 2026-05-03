import "server-only";

import { cookies } from "next/headers";
import { DEFAULT_TZ } from "@/lib/analytics";

export async function getServerTimezone(): Promise<string> {
  const store = await cookies();
  const tz = store.get("tz")?.value;
  if (!tz) return DEFAULT_TZ;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: decodeURIComponent(tz) });
    return decodeURIComponent(tz);
  } catch {
    return DEFAULT_TZ;
  }
}
