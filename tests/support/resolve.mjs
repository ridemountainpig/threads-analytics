// Lets the test suite import app modules the way the Next.js build resolves
// them. Node's type stripping handles the TypeScript syntax, but not the
// bundler-style specifiers the app uses: the "@/" alias, extensionless
// relative imports, and the ".web.ts" suffix that picks the web target
// (tsconfig.json's moduleSuffixes). Loaded with `node --import` ahead of the
// tests.

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

module.registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(withSuffix(new URL(specifier.slice(2), root)), context);
    }
    const parent = context.parentURL ?? "";
    const fromAppSource = parent.endsWith(".ts") && !parent.includes("/node_modules/");
    if (fromAppSource && (specifier.startsWith("./") || specifier.startsWith("../"))) {
      return nextResolve(withSuffix(new URL(specifier, parent)), context);
    }
    return nextResolve(specifier, context);
  },
});
