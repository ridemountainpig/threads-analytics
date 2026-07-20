import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Layouts don't re-render on client-side navigation, so the session must be
// re-verified here in the data layer, not only in the dashboard layout.
export const requireSession = cache(async (): Promise<void> => {
  if (!(await getSession())) redirect("/login");
});

export const getActiveAccount = cache(async () => {
  await requireSession();
  return db.threadsAccount.findFirst({
    where: { isActive: true },
    include: { syncState: true },
  });
});

export const getSyncIntervalCached = cache(async (): Promise<string> => {
  await requireSession();
  const setting = await db.appSettings.findUnique({ where: { key: "syncInterval" } });
  return setting?.value ?? "0";
});
