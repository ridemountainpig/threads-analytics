import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readlinkSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const desktopDirectory = path.join(repositoryRoot, "desktop");
const appBundleName = "Threads Analytics.app";
const appPath = path.join(desktopDirectory, "zig-out", "package", appBundleName);
const resourcesDirectory = path.join(appPath, "Contents", "Resources");
const mainExecutable = path.join(appPath, "Contents", "MacOS", "threads-analytics-desktop");
const defaultBinary = path.join(desktopDirectory, "zig-out", "bin", "threads-analytics-desktop");
const require = createRequire(import.meta.url);

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function assertPackagingRuntime() {
  const pinnedNode = readFileSync(path.join(repositoryRoot, ".nvmrc"), "utf8")
    .trim()
    .replace(/^v/, "");

  if (process.versions.node !== pinnedNode) {
    throw new Error(
      `[desktop] Packaging requires Node ${pinnedNode}; current runtime is ${process.versions.node}. ` +
        "Activate the version from .nvmrc and reinstall dependencies before packaging.",
    );
  }

  try {
    const Database = require("better-sqlite3");
    const database = new Database(":memory:");
    database.close();
  } catch (error) {
    throw new Error(
      `[desktop] better-sqlite3 is not compatible with Node ${process.versions.node}. ` +
        "Reinstall dependencies with the Node version from .nvmrc before packaging.",
      { cause: error },
    );
  }
}

function run(command, args, cwd = repositoryRoot) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function findNativeAddons(directory) {
  const results = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...findNativeAddons(entryPath));
    if (entry.isFile() && entry.name.endsWith(".node")) results.push(entryPath);
  }
  return results;
}

function restoreSymlinks(sourceDirectory, destinationDirectory) {
  for (const entry of readdirSync(sourceDirectory, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDirectory, entry.name);
    const destinationPath = path.join(destinationDirectory, entry.name);

    if (entry.isDirectory()) {
      restoreSymlinks(sourcePath, destinationPath);
      continue;
    }

    if (!entry.isSymbolicLink()) continue;
    if (!existsSync(sourcePath)) continue;

    mkdirSync(path.dirname(destinationPath), { recursive: true });
    rmSync(destinationPath, { recursive: true, force: true });
    const target = readlinkSync(sourcePath);
    symlinkSync(target, destinationPath);
  }
}

assertPackagingRuntime();

if (process.argv.includes("--check")) {
  console.info(
    `[desktop] packaging runtime is compatible (Node ${process.versions.node}, ABI ${process.versions.modules})`,
  );
} else {
  const fromZigBuild = process.argv.includes("--from-zig-build");
  const binaryArgument = argumentValue("--binary");
  if (fromZigBuild && !binaryArgument) {
    throw new Error("--from-zig-build requires --binary");
  }

  if (!fromZigBuild) {
    run("pnpm", ["run", "desktop:build:web"]);
    run(path.join(repositoryRoot, "node_modules", ".bin", "native"), ["build", "desktop", "--yes"]);
  }

  const binaryPath = binaryArgument
    ? path.resolve(desktopDirectory, binaryArgument)
    : defaultBinary;

  rmSync(appPath, { recursive: true, force: true });
  run(
    path.join(repositoryRoot, "node_modules", ".bin", "native"),
    [
      "package",
      "--target",
      "macos",
      "--manifest",
      "app.json",
      "--binary",
      binaryPath,
      "--assets",
      "dist",
      "--output",
      path.join("zig-out", "package", appBundleName),
      "--signing",
      "none",
    ],
    desktopDirectory,
  );

  const embeddedNode = path.join(resourcesDirectory, "dist", "runtime", "node");
  restoreSymlinks(path.join(desktopDirectory, "dist"), path.join(resourcesDirectory, "dist"));
  mkdirSync(path.dirname(embeddedNode), { recursive: true });
  copyFileSync(process.execPath, embeddedNode);
  chmodSync(embeddedNode, 0o755);

  const packageManifestPath = path.join(resourcesDirectory, "package-manifest.zon");
  const packageManifest = readFileSync(packageManifestPath, "utf8").replace(
    '.signing = "none",',
    '.signing = "adhoc-after-sidecar-staging",',
  );
  writeFileSync(packageManifestPath, packageManifest);
  writeFileSync(
    path.join(resourcesDirectory, "signing-plan.txt"),
    "signing=adhoc\nNode sidecar staged after Native SDK asset bundling\n",
  );
  writeFileSync(
    path.join(resourcesDirectory, "README.txt"),
    "Ad-hoc signed local Native SDK macOS app bundle with an embedded Node sidecar.\n",
  );

  for (const binary of [...findNativeAddons(resourcesDirectory), embeddedNode, mainExecutable]) {
    run("codesign", ["--force", "--sign", "-", "--timestamp=none", binary]);
  }
  run("codesign", ["--force", "--sign", "-", "--timestamp=none", appPath]);
  run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", appPath]);

  console.info(`[desktop] packaged ad-hoc signed app at ${appPath}`);
}
