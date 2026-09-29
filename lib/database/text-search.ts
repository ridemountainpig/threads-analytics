import { isDesktopApp } from "@/lib/runtime-target";

// Prisma's SQLite connector rejects `mode: "insensitive"`, but SQLite's LIKE
// (and therefore `contains`) is already case-insensitive for ASCII, so the
// desktop build gets equivalent behavior by omitting the mode.
export function textContainsInsensitive(query: string): {
  contains: string;
  mode?: "insensitive";
} {
  return isDesktopApp ? { contains: query } : { contains: query, mode: "insensitive" };
}
