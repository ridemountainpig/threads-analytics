// Prints one version's section of CHANGELOG.md: the lines under "## <version>"
// up to the next "## " heading. The release workflow leads the GitHub Release
// notes with it. Uses Node built-ins only, like sign-update-feed.mjs.
//
//   node desktop/scripts/changelog-section.mjs 0.1.1 [--changelog CHANGELOG.md]
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

export function changelogSection(markdown, version) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trimEnd() === `## ${version}`);
  if (start === -1) return null;
  const next = lines.findIndex((line, index) => index > start && line.startsWith("## "));
  const body = lines
    .slice(start + 1, next === -1 ? undefined : next)
    .join("\n")
    .trim();
  return body || null;
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      changelog: {
        type: "string",
        default: path.join(
          path.dirname(fileURLToPath(import.meta.url)),
          "..",
          "..",
          "CHANGELOG.md",
        ),
      },
    },
  });
  const [version] = positionals;
  if (!version) throw new Error("a version such as 0.1.1 is required");

  const section = changelogSection(readFileSync(values.changelog, "utf8"), version);
  if (!section)
    throw new Error(`${values.changelog} has no "## ${version}" section, or it is empty`);
  process.stdout.write(`${section}\n`);
}

if (import.meta.main) {
  try {
    main();
  } catch (error) {
    console.error(`[changelog] ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}
