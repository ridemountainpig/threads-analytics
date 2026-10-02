import "server-only";

import { cookies } from "next/headers";
import { DEFAULT_TZ } from "@/lib/analytics";
import { isValidTimeZone } from "@/lib/time-range";

export async function getServerTimezone(): Promise<string> {
  const store = await cookies();
  const tz = store.get("tz")?.value;
  if (!tz) return DEFAULT_TZ;
  let decoded: string;
  try {
    decoded = decodeURIComponent(tz);
  } catch {
    return DEFAULT_TZ;
  }
  return isValidTimeZone(decoded) ? decoded : DEFAULT_TZ;
}
