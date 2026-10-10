// Boots a packaged app's sidecar the way the Zig shell does and checks that it
// serves. The bundle is copied outside the repository first: inside it, Node's
// parent-directory module lookup can fall back to the repo's node_modules and
// hide a dependency the bundle forgot to ship. --shell launches the bundle's
// own executable instead, so the signed shell starts the sidecar itself.
//
//   node desktop/scripts/smoke-test-app.mjs ["path/to/Threads Analytics.app"] [--shell]
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const launchShell = process.argv.includes("--shell");
const sourceApp = path.resolve(
  process.argv.slice(2).find((argument) => !argument.startsWith("--")) ??
    path.join(repositoryRoot, "desktop", "zig-out", "package", "Threads Analytics.app"),
);
const origin = "http://127.0.0.1:43127";
const bootTimeoutMs = 60_000;

const workDirectory = mkdtempSync(path.join(os.tmpdir(), "threads-analytics-smoke-"));
const app = path.join(workDirectory, path.basename(sourceApp));
const runtimeDirectory = path.join(app, "Contents", "Resources", "dist", "runtime");
const serverDirectory = path.join(app, "Contents", "Resources", "dist", "server");

function fail(message) {
  throw new Error(`[smoke] ${message}`);
}

async function probe(pathname, init) {
  try {
    return await fetch(`${origin}${pathname}`, { ...init, signal: AbortSignal.timeout(5000) });
  } catch {
    return null;
  }
}

// fetch() silently drops a custom Host header, so the rebinding probe needs
// node:http to put the foreign hostname on the wire.
function statusWithHost(pathname, method, host) {
  return new Promise((resolve) => {
    const request = http.request(
      `${origin}${pathname}`,
      { method, headers: { Host: host }, timeout: 5000 },
      (response) => {
        response.resume();
        resolve(response.statusCode);
      },
    );
    request.on("timeout", () => request.destroy());
    request.on("error", () => resolve(null));
    request.end();
  });
}

// A fresh connection per check: fetch()'s pooled keep-alive socket can still
// reach a server that has stopped listening, and keeps it from closing.
function acceptsConnections() {
  return new Promise((resolve) => {
    const request = http.request(`${origin}/`, { agent: false, timeout: 2000 }, (response) => {
      response.resume();
      resolve(true);
    });
    request.on("timeout", () => request.destroy());
    request.on("error", () => resolve(false));
    request.end();
  });
}

let server = null;
let output = "";

try {
  const copy = spawnSync("ditto", [sourceApp, app], { stdio: "inherit" });
  if (copy.status !== 0) fail(`could not copy ${sourceApp}`);

  if (await probe("/")) fail(`${origin} is already in use; quit other instances first`);

  const environment = { ...process.env };
  delete environment.NODE_PATH;
  delete environment.NODE_OPTIONS;
  const dataDirectory = path.join(workDirectory, "data");
  const [command, args, cwd] = launchShell
    ? [path.join(app, "Contents", "MacOS", "threads-analytics-desktop"), [], workDirectory]
    : [path.join(runtimeDirectory, "node"), ["start-server.mjs"], runtimeDirectory];
  server = spawn(command, args, {
    cwd,
    env: {
      ...environment,
      THREADS_ANALYTICS_DATA_DIR: dataDirectory,
      SYNC_SCHEDULER_ENABLED: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => (output += chunk));
  server.stderr.on("data", (chunk) => (output += chunk));
  const exited = new Promise((resolve) => server.once("exit", resolve));

  const deadline = Date.now() + bootTimeoutMs;
  let instance = null;
  while (Date.now() < deadline) {
    const exitCode = await Promise.race([exited, new Promise((r) => setTimeout(r, 500))]);
    if (exitCode !== undefined) {
      fail(`${path.basename(command)} exited with ${exitCode} before serving`);
    }
    instance = await probe("/api/desktop/instance");
    if (instance?.ok) break;
  }
  if (!instance?.ok) fail(`sidecar did not serve within ${bootTimeoutMs / 1000}s`);
  if (!existsSync(path.join(dataDirectory, "threads-analytics.db"))) {
    fail(`sidecar did not use THREADS_ANALYTICS_DATA_DIR (${dataDirectory})`);
  }

  const expectedBuildId = readFileSync(path.join(serverDirectory, ".next", "BUILD_ID"), "utf8");
  const { buildId } = await instance.json();
  if (buildId !== expectedBuildId.trim())
    fail(`served build ${buildId}, expected ${expectedBuildId}`);

  // Renders from SQLite, so it proves the migrated database and Prisma adapter load.
  const dashboard = await probe("/dashboard/settings");
  if (dashboard?.status !== 200) fail(`/dashboard/settings returned ${dashboard?.status}`);

  // DNS-rebinding guard: a foreign Host must be refused on every route,
  // including pages that host Server Actions.
  for (const [pathname, method] of [
    ["/", "POST"],
    ["/login", "POST"],
    ["/oauth/authorize", "GET"],
    ["/api/status", "GET"],
  ]) {
    const status = await statusWithHost(pathname, method, "rebind.example:43127");
    if (status !== 403) {
      fail(`${method} ${pathname} with a foreign Host returned ${status}, expected 403`);
    }
  }

  // Once the app is gone, by quitting or by force, the sidecar must release the
  // port; otherwise the next launch (or the next CI step) cannot bind it.
  if (launchShell) {
    server.kill("SIGTERM");
    const quit = await Promise.race([
      exited.then(() => true),
      sleep(10_000, false, { ref: false }),
    ]);
    if (!quit) {
      // An annotation, not a failure: the shell can stall in its stop hook.
      console.log("::warning::the app did not quit within 10s of SIGTERM; killing it");
      server.kill("SIGKILL");
      await exited;
    }
    const releaseDeadline = Date.now() + 10_000;
    while ((await acceptsConnections()) && Date.now() < releaseDeadline) await sleep(500);
    if (await acceptsConnections()) fail("sidecar kept serving after the app exited");
  }

  console.info(
    `[smoke] ${path.basename(sourceApp)} booted ${launchShell ? "its shell " : ""}outside the repository and served`,
  );
} catch (error) {
  if (output) console.error(output);
  throw error;
} finally {
  server?.kill("SIGTERM");
  rmSync(workDirectory, { recursive: true, force: true });
}
