import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, generateKeyPairSync } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  createUpdateFeed,
  privateKeyFromSeed,
  publicKeyBase64,
  validateRelease,
  verifyUpdateFeed,
} from "../scripts/sign-update-feed.mjs";

const desktopDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const signScript = path.join(desktopDirectory, "scripts", "sign-update-feed.mjs");

// Shared with the Zig test in desktop/src/main.zig, which checks the Native SDK
// verifier accepts this exact feed. Regenerate both together.
const VECTOR_SEED = "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=";
const VECTOR_PUBLIC_KEY = "A6EHv/POEL4dcN0Y50vAmWfk1jCbpQ1fHdyGZBJVMbg=";
const VECTOR_RELEASE = {
  bundle_id: "dev.ridemountainpig.threads-analytics",
  version: "1.2.3",
  target: "macos-aarch64",
  archive_url:
    "https://github.com/ridemountainpig/threads-analytics/releases/download/v1.2.3/Threads-Analytics-1.2.3-macos-arm64.zip",
  archive_bytes: 123456789,
  sha256: "9c7ec3bc3aaa0af39d787e991f33a9bef38c0ba61418fd15dc62077f304d66a4",
  release_notes: "Faster sync.\n同步更快。",
};

function randomSeed() {
  const { privateKey } = generateKeyPairSync("ed25519");
  return privateKey.export({ format: "der", type: "pkcs8" }).subarray(-32).toString("base64");
}

test("reproduces the feed the Native SDK verifier is tested against", () => {
  const key = privateKeyFromSeed(VECTOR_SEED);
  assert.equal(publicKeyBase64(key), VECTOR_PUBLIC_KEY);
  const expected = readFileSync(
    path.join(desktopDirectory, "src", "testdata", "update-feed.json"),
    "utf8",
  );
  assert.equal(createUpdateFeed(VECTOR_RELEASE, key), expected);
  assert.deepEqual(verifyUpdateFeed(expected, VECTOR_PUBLIC_KEY), VECTOR_RELEASE);
});

test("rejects a feed signed by another key or with a tampered payload", () => {
  const feed = createUpdateFeed(VECTOR_RELEASE, privateKeyFromSeed(VECTOR_SEED));
  const otherKey = publicKeyBase64(privateKeyFromSeed(randomSeed()));
  assert.throws(() => verifyUpdateFeed(feed, otherKey), /signature does not verify/);

  const envelope = JSON.parse(feed);
  const tampered = { ...VECTOR_RELEASE, archive_url: "https://example.com/evil.zip" };
  envelope.payload = Buffer.from(JSON.stringify(tampered)).toString("base64");
  assert.throws(
    () => verifyUpdateFeed(JSON.stringify(envelope), VECTOR_PUBLIC_KEY),
    /signature does not verify/,
  );
});

test("rejects releases the installed app would refuse", () => {
  const invalid = [
    { version: "1.2.3-beta.1" },
    { version: "1.02.3" },
    { target: "linux-x86_64" },
    { archive_url: "http://example.com/app.zip" },
    { archive_url: "https://example.com/release file.zip" },
    { archive_bytes: 0 },
    { sha256: VECTOR_RELEASE.sha256.toUpperCase() },
    { release_notes: "x".repeat(16 * 1024 + 1) },
    { bundle_id: "" },
  ];
  for (const change of invalid) {
    assert.throws(
      () => validateRelease({ ...VECTOR_RELEASE, ...change }),
      /Invalid update release/,
    );
  }
  assert.doesNotThrow(() => validateRelease({ ...VECTOR_RELEASE, release_notes: "" }));
});

test("only accepts a base64 32-byte seed", () => {
  assert.throws(() => privateKeyFromSeed(""), /exactly 32 bytes/);
  assert.throws(() => privateKeyFromSeed(Buffer.alloc(31).toString("base64")), /exactly 32 bytes/);
  assert.throws(() => privateKeyFromSeed(`${VECTOR_SEED.slice(0, -2)}!=`), /exactly 32 bytes/);
  assert.equal(publicKeyBase64(privateKeyFromSeed(`${VECTOR_SEED}\n`)), VECTOR_PUBLIC_KEY);
});

test("signs an archive against the manifest's public key", () => {
  const workDirectory = mkdtempSync(path.join(os.tmpdir(), "threads-analytics-feed-"));
  try {
    const seed = randomSeed();
    const publicKey = publicKeyBase64(privateKeyFromSeed(seed));
    const manifest = path.join(workDirectory, "app.json");
    writeFileSync(
      manifest,
      JSON.stringify({
        id: "dev.ridemountainpig.threads-analytics",
        version: "0.2.0",
        updates: { feed_url: "https://example.com/native-update.json", public_key: publicKey },
      }),
    );
    const archive = path.join(workDirectory, "Threads-Analytics-0.2.0-macos-arm64.zip");
    writeFileSync(archive, "zip bytes");
    const output = path.join(workDirectory, "native-update.json");
    const args = [
      signScript,
      "--manifest",
      manifest,
      "--archive",
      archive,
      "--url",
      "https://example.com/Threads-Analytics-0.2.0-macos-arm64.zip",
      "--output",
      output,
      "--notes",
      "Bug fixes.",
    ];

    const signed = spawnSync(process.execPath, args, {
      env: { ...process.env, NATIVE_UPDATE_PRIVATE_KEY: seed },
      encoding: "utf8",
    });
    assert.equal(signed.status, 0, signed.stderr);
    const release = verifyUpdateFeed(readFileSync(output, "utf8"), publicKey);
    assert.equal(release.version, "0.2.0");
    assert.equal(release.archive_bytes, "zip bytes".length);
    assert.equal(release.sha256, createHash("sha256").update("zip bytes").digest("hex"));
    assert.equal(release.release_notes, "Bug fixes.");

    rmSync(output);
    const mismatched = spawnSync(process.execPath, args, {
      env: { ...process.env, NATIVE_UPDATE_PRIVATE_KEY: randomSeed() },
      encoding: "utf8",
    });
    assert.notEqual(mismatched.status, 0);
    assert.match(mismatched.stderr, /does not match updates\.public_key/);
  } finally {
    rmSync(workDirectory, { recursive: true, force: true });
  }
});
