import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { migrateDatabase } from "../runtime/migrate.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const runtimeDirectory = path.join(repositoryRoot, "desktop", "runtime");
const databasePath = path.join(runtimeDirectory, "dev.db");
const keyPath = path.join(runtimeDirectory, ".dev-token-encryption-key");

if (!existsSync(keyPath)) {
  writeFileSync(keyPath, randomBytes(32).toString("hex"), { mode: 0o600, flag: "wx" });
}

await migrateDatabase({
  databasePath,
  migrationsDirectory: path.join(runtimeDirectory, "prisma", "migrations"),
  backupDirectory: path.join(runtimeDirectory, "backups"),
});

const child = spawn("pnpm", ["exec", "next", "dev", "--hostname", "127.0.0.1", "--port", "43127"], {
  cwd: repositoryRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    THREADS_ANALYTICS_TARGET: "desktop",
    DATABASE_URL: `file:${databasePath}`,
    TOKEN_ENCRYPTION_KEY: readFileSync(keyPath, "utf8").trim(),
    SYNC_SCHEDULER_ENABLED: "true",
  },
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
