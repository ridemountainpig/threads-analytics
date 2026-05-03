import "server-only";

import { cache } from "react";
import { db } from "@/lib/db";

export const getActiveAccount = cache(async () => {
  return db.threadsAccount.findFirst({
    where: { isActive: true },
    include: { syncState: true },
  });
});

export const getSyncIntervalCached = cache(async (): Promise<string> => {
  const setting = await db.appSettings.findUnique({ where: { key: "syncInterval" } });
  return setting?.value ?? "0";
});
