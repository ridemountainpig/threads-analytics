// Boots a packaged app's sidecar the way the Zig shell does and checks that it
// serves. The bundle is copied outside the repository first: inside it, Node's
// parent-directory module lookup can fall back to the repo's node_modules and
// hide a dependency the bundle forgot to ship.
//
//   node desktop/scripts/smoke-test-app.mjs [path/to/Threads-Analytics.app]
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourceApp = path.resolve(
  process.argv[2] ??
    path.join(repositoryRoot, "desktop", "zig-out", "package", "Threads-Analytics.app"),
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

let server = null;
let output = "";

try {
  const copy = spawnSync("ditto", [sourceApp, app], { stdio: "inherit" });
  if (copy.status !== 0) fail(`could not copy ${sourceApp}`);

  if (await probe("/")) fail(`${origin} is already in use; quit other instances first`);

  const environment = { ...process.env };
  delete environment.NODE_PATH;
  delete environment.NODE_OPTIONS;
  server = spawn(path.join(runtimeDirectory, "node"), ["start-server.mjs"], {
    cwd: runtimeDirectory,
    env: {
      ...environment,
      THREADS_ANALYTICS_DATA_DIR: path.join(workDirectory, "data"),
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
    if (exitCode !== undefined) fail(`sidecar exited with ${exitCode} before serving`);
    instance = await probe("/api/desktop/instance");
    if (instance?.ok) break;
  }
  if (!instance?.ok) fail(`sidecar did not serve within ${bootTimeoutMs / 1000}s`);

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

  console.info(`[smoke] ${path.basename(sourceApp)} booted outside the repository and served`);
} catch (error) {
  if (output) console.error(output);
  throw error;
} finally {
  server?.kill("SIGTERM");
  rmSync(workDirectory, { recursive: true, force: true });
}
