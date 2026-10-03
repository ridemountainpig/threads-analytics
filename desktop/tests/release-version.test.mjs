import assert from "node:assert/strict";
import test from "node:test";
import {
  compareReleaseVersions,
  isNewerReleaseVersion,
  parseReleaseVersion,
  pickLatestDesktopRelease,
} from "../../lib/release-version.ts";

test("parses release versions with and without a tag prefix", () => {
  assert.deepEqual(parseReleaseVersion("0.1.0"), {
    major: 0,
    minor: 1,
    patch: 0,
    prerelease: [],
  });
  assert.deepEqual(parseReleaseVersion("v0.1.0-beta.1"), {
    major: 0,
    minor: 1,
    patch: 0,
    prerelease: ["beta", "1"],
  });
  assert.equal(parseReleaseVersion("0.1"), null);
  assert.equal(parseReleaseVersion("0.1.0beta"), null);
  assert.equal(parseReleaseVersion("0.1.0-"), null);
  assert.equal(parseReleaseVersion("0.1.0-beta..1"), null);
});

test("orders versions by SemVer precedence", () => {
  const ordered = [
    "0.1.0-alpha",
    "0.1.0-alpha.1",
    "0.1.0-beta.1",
    "0.1.0-beta.2",
    "0.1.0-beta.10",
    "0.1.0-rc.1",
    "0.1.0",
    "0.1.1-beta.1",
    "0.1.1",
    "0.2.0",
    "1.0.0",
  ];
  for (let index = 1; index < ordered.length; index += 1) {
    const lower = parseReleaseVersion(ordered[index - 1]);
    const higher = parseReleaseVersion(ordered[index]);
    assert.equal(
      compareReleaseVersions(lower, higher),
      -1,
      `${ordered[index - 1]} < ${ordered[index]}`,
    );
    assert.equal(
      compareReleaseVersions(higher, lower),
      1,
      `${ordered[index]} > ${ordered[index - 1]}`,
    );
  }
  assert.equal(
    compareReleaseVersions(parseReleaseVersion("v1.2.3"), parseReleaseVersion("1.2.3")),
    0,
  );
});

test("isNewerReleaseVersion treats a release as newer than its own pre-releases", () => {
  assert.equal(isNewerReleaseVersion("v0.1.0-beta.2", "0.1.0-beta.1"), true);
  assert.equal(isNewerReleaseVersion("v0.1.0", "0.1.0-beta.3"), true);
  assert.equal(isNewerReleaseVersion("v0.1.0-beta.3", "0.1.0"), false);
  assert.equal(isNewerReleaseVersion("v0.1.0-beta.1", "0.1.0-beta.1"), false);
  assert.equal(isNewerReleaseVersion("not-a-version", "0.1.0"), false);
  assert.equal(isNewerReleaseVersion("v0.2.0", "dev"), false);
});

function release(tag, { draft = false, desktop = true } = {}) {
  return {
    tag_name: tag,
    html_url: `https://github.com/example/app/releases/tag/${tag}`,
    draft,
    assets: desktop ? [{ name: `App-${tag.slice(1)}-macos-arm64.zip` }] : [{ name: "web.tar.gz" }],
  };
}

test("pickLatestDesktopRelease skips drafts, web-only releases, and unparsable tags", () => {
  const picked = pickLatestDesktopRelease([
    release("v0.2.0", { draft: true }),
    release("v0.1.5", { desktop: false }),
    { tag_name: "nightly", html_url: "", draft: false, assets: [{ name: "x-macos-arm64.zip" }] },
    release("v0.1.0-beta.2"),
    release("v0.1.0-beta.1"),
  ]);
  assert.equal(picked?.version, "0.1.0-beta.2");
  assert.equal(picked?.release.tag_name, "v0.1.0-beta.2");
});

test("pickLatestDesktopRelease chooses by version, not by listing order", () => {
  const picked = pickLatestDesktopRelease([
    release("v0.1.1"),
    release("v0.2.0-beta.1"),
    release("v0.1.2"),
  ]);
  assert.equal(picked?.version, "0.2.0-beta.1");
  assert.equal(pickLatestDesktopRelease([]), null);
  assert.equal(pickLatestDesktopRelease([release("v0.1.0", { desktop: false })]), null);
});

test("pickLatestDesktopRelease hides pre-releases from stable builds", () => {
  const releases = [release("v0.2.0-beta.1"), release("v0.1.1"), release("v0.1.0")];
  assert.equal(pickLatestDesktopRelease(releases, { includePrereleases: false })?.version, "0.1.1");
  assert.equal(
    pickLatestDesktopRelease(releases, { includePrereleases: true })?.version,
    "0.2.0-beta.1",
  );
  assert.equal(
    pickLatestDesktopRelease([release("v0.2.0-beta.1")], { includePrereleases: false }),
    null,
  );
});
