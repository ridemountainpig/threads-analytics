import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const desktopDirectory = path.join(repositoryRoot, "desktop");
const outputDirectory = path.join(desktopDirectory, "dist");
const webIcon = path.join(repositoryRoot, "public", "threads-analytics-icon.png");
const desktopIcon = path.join(desktopDirectory, "assets", "icon.png");

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// The version the app reports and compares against GitHub Releases. The
// manifest only allows plain X.Y.Z, so the release workflow passes the full
// release version (e.g. 0.1.0-beta.1) through THREADS_ANALYTICS_DESKTOP_VERSION;
// local packages fall back to the manifest version.
function resolveDesktopVersion() {
  const manifestVersion = JSON.parse(
    readFileSync(path.join(desktopDirectory, "app.json"), "utf8"),
  ).version;
  const override = process.env.THREADS_ANALYTICS_DESKTOP_VERSION;
  if (!override) return manifestVersion;
  if (override.split("-")[0] !== manifestVersion) {
    throw new Error(
      `THREADS_ANALYTICS_DESKTOP_VERSION "${override}" does not match desktop/app.json version "${manifestVersion}"`,
    );
  }
  return override;
}

const buildEnvironment = {
  THREADS_ANALYTICS_TARGET: "desktop",
  THREADS_ANALYTICS_DESKTOP_VERSION: resolveDesktopVersion(),
  DATABASE_URL: `file:${path.join(desktopDirectory, "runtime", "build.db")}`,
  TOKEN_ENCRYPTION_KEY: "desktop-build-only-key-not-used-for-user-data",
  SYNC_SCHEDULER_ENABLED: "false",
  NEXT_TELEMETRY_DISABLED: "1",
};

// Keep previous desktop artifacts out of Next's output-file tracing input.
rmSync(outputDirectory, { recursive: true, force: true });
copyFileSync(webIcon, desktopIcon);

run("pnpm", ["exec", "prisma", "generate", "--schema", "prisma/schema.prisma"], buildEnvironment);
run(
  "pnpm",
  ["exec", "prisma", "generate", "--schema", "desktop/runtime/prisma/schema.prisma"],
  buildEnvironment,
);
run("pnpm", ["exec", "next", "build"], buildEnvironment);

const standaloneDirectory = path.join(repositoryRoot, ".next", "standalone");
if (!existsSync(path.join(standaloneDirectory, "server.js"))) {
  throw new Error(`Next standalone output not found at ${standaloneDirectory}`);
}

mkdirSync(path.join(outputDirectory, "server", ".next"), { recursive: true });
// Keep Next/pnpm links relative to the staged runtime. The macOS packager
// restores these links after Native SDK has bundled the regular assets.
cpSync(standaloneDirectory, path.join(outputDirectory, "server"), {
  recursive: true,
  verbatimSymlinks: true,
});
cpSync(path.join(repositoryRoot, "public"), path.join(outputDirectory, "server", "public"), {
  recursive: true,
});
cpSync(
  path.join(repositoryRoot, ".next", "static"),
  path.join(outputDirectory, "server", ".next", "static"),
  { recursive: true },
);
mkdirSync(path.join(outputDirectory, "runtime", "prisma"), { recursive: true });
cpSync(
  path.join(desktopDirectory, "runtime", "start-server.mjs"),
  path.join(outputDirectory, "runtime", "start-server.mjs"),
);
cpSync(
  path.join(desktopDirectory, "runtime", "migrate.mjs"),
  path.join(outputDirectory, "runtime", "migrate.mjs"),
);
cpSync(
  path.join(desktopDirectory, "runtime", "server-lifecycle.mjs"),
  path.join(outputDirectory, "runtime", "server-lifecycle.mjs"),
);
cpSync(
  path.join(desktopDirectory, "runtime", "prisma", "migrations"),
  path.join(outputDirectory, "runtime", "prisma", "migrations"),
  { recursive: true },
);
cpSync(
  path.join(desktopDirectory, "runtime", "loading.html"),
  path.join(outputDirectory, "index.html"),
);

// The desktop build renders images unoptimized (next.config.ts), so sharp and
// its libvips dylib are dead weight — and libvips is larger than the Native
// SDK packager's 16 MiB per-asset cap, which would fail `native package`.
const stagedNodeModules = path.join(outputDirectory, "server", "node_modules");
for (const link of ["sharp", "@img"]) {
  rmSync(path.join(stagedNodeModules, link), { recursive: true, force: true });
}
if (existsSync(path.join(stagedNodeModules, ".pnpm"))) {
  for (const entry of readdirSync(path.join(stagedNodeModules, ".pnpm"))) {
    if (entry.startsWith("sharp@") || entry.startsWith("@img+")) {
      rmSync(path.join(stagedNodeModules, ".pnpm", entry), { recursive: true, force: true });
    }
  }
}

// migrate.mjs imports better-sqlite3, but dist/runtime sits beside dist/server,
// not under it, so Node's parent-directory lookup never reaches the server's
// node_modules once the app lives outside this repository. Link the package the
// standalone output already traced; the macOS packager restores this link too.
const stagedPnpmDirectory = path.join(stagedNodeModules, ".pnpm");
const sqlitePackageEntry = existsSync(stagedPnpmDirectory)
  ? readdirSync(stagedPnpmDirectory).find((entry) => entry.startsWith("better-sqlite3@"))
  : undefined;
if (!sqlitePackageEntry) {
  throw new Error(`better-sqlite3 was not traced into ${stagedNodeModules}`);
}
const runtimeNodeModules = path.join(outputDirectory, "runtime", "node_modules");
mkdirSync(runtimeNodeModules, { recursive: true });
symlinkSync(
  path.relative(
    runtimeNodeModules,
    path.join(stagedPnpmDirectory, sqlitePackageEntry, "node_modules", "better-sqlite3"),
  ),
  path.join(runtimeNodeModules, "better-sqlite3"),
);

console.info(`[desktop] staged Next runtime at ${outputDirectory}`);
