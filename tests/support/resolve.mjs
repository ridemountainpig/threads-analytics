// Lets the test suite import app modules the way the Next.js build resolves
// them. Node's type stripping handles the TypeScript syntax, but not the
// bundler-style specifiers the app uses: the "@/" alias, extensionless
// relative imports, the ".web.ts" suffix that picks the web target
// (tsconfig.json's moduleSuffixes), extensionless package subpaths and the
// "server-only" marker. Loaded with `node --import` ahead of the tests.

import module from "node:module";
import { existsSync } from "node:fs";

if (typeof module.registerHooks !== "function") {
  throw new Error("The test suite needs Node.js 22.15 or later (module.registerHooks).");
}

const root = new URL("../../", import.meta.url);
// Same order as tsconfig.json's moduleSuffixes: the web target wins.
const SUFFIXES = [".web.ts", ".ts"];

function withSuffix(url) {
  if (/\.[cm]?[jt]s$/.test(url.pathname)) return url.href;
  for (const suffix of SUFFIXES) {
    const candidate = new URL(url.href + suffix);
    if (existsSync(candidate)) return candidate.href;
  }
  return url.href;
}

// No test reaches a real database: the app's client resolves to an in-memory
// stand-in, which tests import from ./fake-db.mjs to seed and inspect.
const APP_DB = new URL("lib/db.ts", root).href;
const FAKE_DB = new URL("fake-db.mjs", import.meta.url).href;

module.registerHooks({
  resolve(specifier, context, nextResolve) {
    const resolved = resolveLikeNext(specifier, context, nextResolve);
    return resolved.url === APP_DB
      ? { url: FAKE_DB, format: "module", shortCircuit: true }
      : resolved;
  },
});

function resolveLikeNext(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    return nextResolve(withSuffix(new URL(specifier.slice(2), root)), context);
  }
  const parent = context.parentURL ?? "";
  const fromAppSource = parent.endsWith(".ts") && !parent.includes("/node_modules/");
  if (!fromAppSource) return nextResolve(specifier, context);

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return nextResolve(withSuffix(new URL(specifier, parent)), context);
  }
  // Next compiles server code with the marker resolved to its empty build.
  if (specifier === "server-only") {
    return nextResolve("next/dist/compiled/server-only/empty.js", context);
  }
  try {
    return nextResolve(specifier, context);
  } catch (error) {
    // Packages without an exports map (next/server, next/headers) leave the
    // extension to the bundler.
    if (error?.code !== "ERR_MODULE_NOT_FOUND" || /\.[cm]?js$/.test(specifier)) throw error;
    return nextResolve(`${specifier}.js`, context);
  }
}
