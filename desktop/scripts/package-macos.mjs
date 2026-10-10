import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  chmodSync,
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readlinkSync,
  readFileSync,
  readSync,
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
const defaultBinary = path.join(desktopDirectory, "zig-out", "bin", "threads-analytics-desktop");
// V8 needs JIT memory, which the hardened runtime blocks without allow-jit.
const nodeEntitlements = path.join(desktopDirectory, "assets", "node.entitlements");
const signingIdentity = process.env.MACOS_SIGNING_IDENTITY?.trim() || null;
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

// Notarization requires the hardened runtime and a secure timestamp.
function codesign(target, entitlements) {
  const args = signingIdentity
    ? ["--force", "--sign", signingIdentity, "--options", "runtime", "--timestamp"]
    : ["--force", "--sign", "-", "--timestamp=none"];
  if (entitlements) args.push("--entitlements", entitlements);
  run("codesign", [...args, target]);
}

const machOMagics = new Set([0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe]);
const fatMagics = new Set([0xcafebabe, 0xcafebabf]);

// Notarization rejects any nested Mach-O not signed with the Developer ID, so
// match by header rather than by extension (.node, .dylib, bare executables).
function isMachO(file) {
  const header = Buffer.alloc(8);
  const descriptor = openSync(file, "r");
  try {
    if (readSync(descriptor, header, 0, header.length, 0) < header.length) return false;
  } finally {
    closeSync(descriptor);
  }
  const magic = header.readUInt32BE(0);
  // Java class files share the fat magic; their version field is far above any arch count.
  return machOMagics.has(magic) || (fatMagics.has(magic) && header.readUInt32BE(4) < 20);
}

function findMachOFiles(directory) {
  const results = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...findMachOFiles(entryPath));
    if (entry.isFile() && isMachO(entryPath)) results.push(entryPath);
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

  const signingMode = signingIdentity ? "developer-id" : "adhoc";
  const packageManifestPath = path.join(resourcesDirectory, "package-manifest.zon");
  const packageManifest = readFileSync(packageManifestPath, "utf8").replace(
    '.signing = "none",',
    `.signing = "${signingMode}-after-sidecar-staging",`,
  );
  writeFileSync(packageManifestPath, packageManifest);
  writeFileSync(
    path.join(resourcesDirectory, "signing-plan.txt"),
    `signing=${signingMode}\nNode sidecar staged after Native SDK asset bundling\n`,
  );
  writeFileSync(
    path.join(resourcesDirectory, "README.txt"),
    `${signingIdentity ? "Developer ID signed" : "Ad-hoc signed local"} Native SDK macOS app bundle with an embedded Node sidecar.\n`,
  );

  for (const binary of findMachOFiles(resourcesDirectory)) {
    if (binary !== embeddedNode) codesign(binary);
  }
  codesign(embeddedNode, nodeEntitlements);
  // Signing the bundle also signs its main executable.
  codesign(appPath);
  run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", appPath]);

  console.info(`[desktop] packaged ${signingMode} signed app at ${appPath}`);
}
