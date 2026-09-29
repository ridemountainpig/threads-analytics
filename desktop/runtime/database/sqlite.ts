import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import type { PrismaClient as AppPrismaClient } from "../../../lib/generated/prisma";
import { PrismaClient as SqlitePrismaClient } from "../generated/prisma";

const globalForPrisma = globalThis as unknown as {
  desktopPrisma?: SqlitePrismaClient;
};

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) {
    throw new Error("Desktop DATABASE_URL must be a file: SQLite URL");
  }

  const adapter = new PrismaBetterSqlite3({ url });
  return new SqlitePrismaClient({ adapter });
}

// Both Prisma schemas deliberately expose the same models. Keeping the public
// type equal to the web client lets shared server code remain database-agnostic.
export function getSqliteDb(): AppPrismaClient {
  if (!globalForPrisma.desktopPrisma) globalForPrisma.desktopPrisma = createClient();
  return globalForPrisma.desktopPrisma as unknown as AppPrismaClient;
}
