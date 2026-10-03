import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { migrateDatabase } from "./migrate.mjs";
import {
  fetchInstanceBuildId,
  isPortServing,
  requestShutdown,
  waitForPortFree,
  watchParentExit,
} from "./server-lifecycle.mjs";

const runtimeDirectory = path.dirname(fileURLToPath(import.meta.url));

const serverHost = "127.0.0.1";
// Fixed, not read from PORT: the WebView URL (app.json), the shell's allowed
// origins (main.zig) and loading.html all point at this port, so a stray PORT
// in the environment would leave the window pointed at nothing.
const serverPort = 43127;

watchParentExit();

function readLocalBuildId(serverDirectory) {
  try {
    return readFileSync(path.join(serverDirectory, ".next", "BUILD_ID"), "utf8").trim();
  } catch {
    return null;
  }
}

// Another instance may already own the port. Give an orphaned sidecar a
// moment to notice its parent died and release it. A survivor is a genuinely
// running instance: reuse it only when it is the same build — the WebView URL
// is pinned to this port, so silently reusing a stale build would keep showing
// the old app after an update. A different (or unidentifiable) build is asked
// to shut down so this launch can take over.
if (await isPortServing(serverHost, serverPort)) {
  if (!(await waitForPortFree(serverHost, serverPort, 5000))) {
    const localBuildId = readLocalBuildId(resolveServerDirectory());
    const remoteBuildId = await fetchInstanceBuildId(serverHost, serverPort);
    if (localBuildId !== null && remoteBuildId === localBuildId) {
      console.info(`[desktop] port ${serverPort} is already served by the same build; reusing it`);
      process.exit(0);
    }
    console.info(
      `[desktop] port ${serverPort} is served by a different build (${remoteBuildId ?? "unidentified"}); asking it to shut down`,
    );
    await requestShutdown(serverHost, serverPort);
    if (!(await waitForPortFree(serverHost, serverPort, 15000))) {
      console.error(
        `[desktop] port ${serverPort} is still held by another instance that did not shut down; quit the other Threads Analytics instance and reopen the app`,
      );
      process.exit(1);
    }
  }
}

function resolveDataDirectory() {
  if (process.env.THREADS_ANALYTICS_DATA_DIR) {
    return path.resolve(process.env.THREADS_ANALYTICS_DATA_DIR);
  }

  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Threads Analytics");
  }

  const base = process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share");
  return path.join(base, "threads-analytics");
}

function resolveServerDirectory() {
  if (process.env.THREADS_ANALYTICS_SERVER_DIR) {
    return path.resolve(process.env.THREADS_ANALYTICS_SERVER_DIR);
  }

  const stagedNextToRuntime = path.resolve(runtimeDirectory, "../server");
  if (existsSync(path.join(stagedNextToRuntime, "server.js"))) return stagedNextToRuntime;

  return path.resolve(runtimeDirectory, "../dist/server");
}

function loadOrCreateEncryptionKey(dataDirectory) {
  const keyPath = path.join(dataDirectory, ".token-encryption-key");
  if (!existsSync(keyPath)) {
    writeFileSync(keyPath, randomBytes(32).toString("hex"), {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
  }
  chmodSync(keyPath, 0o600);
  return readFileSync(keyPath, "utf8").trim();
}

const dataDirectory = resolveDataDirectory();
mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
chmodSync(dataDirectory, 0o700);

const databasePath = path.join(dataDirectory, "threads-analytics.db");
const migrationsDirectory = path.join(runtimeDirectory, "prisma", "migrations");

function resolveBackupRetention() {
  const raw = process.env.THREADS_ANALYTICS_BACKUP_RETENTION;
  if (raw === undefined) return undefined;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(
      `THREADS_ANALYTICS_BACKUP_RETENTION must be a non-negative integer, got "${raw}"`,
    );
  }
  return parsed;
}

const migrationResult = await migrateDatabase({
  databasePath,
  migrationsDirectory,
  backupDirectory: path.join(dataDirectory, "backups"),
  backupRetention: resolveBackupRetention(),
});

if (migrationResult.applied.length > 0) {
  console.info("[desktop] applied SQLite migrations", migrationResult.applied);
}

const serverDirectory = resolveServerDirectory();
const serverEntry = path.join(serverDirectory, "server.js");
if (!existsSync(serverEntry)) {
  throw new Error(
    `Desktop Next runtime not found at ${serverEntry}. Run \"pnpm desktop:build:web\" first.`,
  );
}

process.env.HOSTNAME = "127.0.0.1";
process.env.PORT = String(serverPort);
process.env.THREADS_ANALYTICS_TARGET = "desktop";
process.env.DATABASE_URL = `file:${databasePath}`;
process.env.TOKEN_ENCRYPTION_KEY = loadOrCreateEncryptionKey(dataDirectory);
process.env.SYNC_SCHEDULER_ENABLED = process.env.SYNC_SCHEDULER_ENABLED ?? "true";

process.chdir(serverDirectory);
await import(pathToFileURL(serverEntry).href);
