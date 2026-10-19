import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { changelogSection } from "../scripts/changelog-section.mjs";

const changelog = `# Changelog

Intro.

## 0.2.0

### New

- Second feature.

## 0.1.10

- Not this one.

## 0.1.1

### Fixed

- A fix.
`;

test("returns the lines under a version heading up to the next one", () => {
  assert.equal(changelogSection(changelog, "0.2.0"), "### New\n\n- Second feature.");
});

test("reads the last section to the end of the file", () => {
  assert.equal(changelogSection(changelog, "0.1.1"), "### Fixed\n\n- A fix.");
});

test("matches the whole version, not a prefix", () => {
  assert.equal(changelogSection(changelog, "0.1"), null);
  assert.equal(changelogSection(changelog, "0.1.10"), "- Not this one.");
});

test("returns null for a missing or empty section", () => {
  assert.equal(changelogSection(changelog, "9.9.9"), null);
  assert.equal(changelogSection("## 1.0.0\n\n\n## 0.9.0\n- Old.\n", "1.0.0"), null);
});

test("handles CRLF line endings", () => {
  assert.equal(changelogSection("## 1.0.0\r\n\r\n- Done.\r\n", "1.0.0"), "- Done.");
});

test("the repository changelog has a section for the current version", () => {
  const { version } = JSON.parse(
    readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
  );
  const output = execFileSync(process.execPath, [
    fileURLToPath(new URL("../scripts/changelog-section.mjs", import.meta.url)),
    version,
  ]);
  assert.ok(output.toString().trim().length > 0);
});
