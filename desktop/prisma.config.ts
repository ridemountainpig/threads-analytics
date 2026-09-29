import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "runtime/prisma/schema.prisma",
  migrations: {
    path: "runtime/prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./runtime/dev.db",
  },
});
