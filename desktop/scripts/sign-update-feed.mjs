// Signs the Native SDK update feed for a release ZIP. Installed apps download
// the feed from updates.feed_url, verify its Ed25519 signature against
// updates.public_key in desktop/app.json, and only then download the ZIP,
// whose size and SHA-256 the signed payload pins. Uses Node built-ins only, so
// the release workflow can sign in a job that never installs dependencies.
//
//   NATIVE_UPDATE_PRIVATE_KEY=<base64 seed> node desktop/scripts/sign-update-feed.mjs \
//     --archive Threads-Analytics-0.1.0-macos-arm64.zip \
//     --url https://github.com/<repo>/releases/download/v0.1.0/Threads-Analytics-0.1.0-macos-arm64.zip \
//     --output native-update.json [--notes "What changed"]
//
// NATIVE_UPDATE_PRIVATE_KEY is the base64 of the 32-byte seed that
// `native update keygen` writes. The wire format and limits mirror the
// verifier in node_modules/@native-sdk/cli/src/updater/feed.zig.
import { createHash, createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { createReadStream, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const MAX_ENVELOPE_BYTES = 64 * 1024;
const MAX_PAYLOAD_BYTES = 32 * 1024;
const MAX_RELEASE_NOTES_BYTES = 16 * 1024;
const MAX_ARCHIVE_URL_BYTES = 4096;
const MAX_ARCHIVE_BYTES = 8 * 1024 * 1024 * 1024;
const TARGETS = ["macos-aarch64", "macos-x86_64"];
const PAYLOAD_FIELDS = [
  "bundle_id",
  "version",
  "target",
  "archive_url",
  "archive_bytes",
  "sha256",
  "release_notes",
];

// DER headers that wrap a raw 32-byte Ed25519 seed or public key.
const PKCS8_ED25519_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");
const SPKI_ED25519_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function decodeKeyBytes(value, label) {
  const text = String(value ?? "").trim();
  const bytes = Buffer.from(text, "base64");
  if (bytes.length !== 32 || bytes.toString("base64") !== text) {
    throw new Error(`${label} must be the base64 of exactly 32 bytes`);
  }
  return bytes;
}

export function privateKeyFromSeed(seedBase64) {
  const seed = decodeKeyBytes(seedBase64, "The update private key");
  return createPrivateKey({
    key: Buffer.concat([PKCS8_ED25519_PREFIX, seed]),
    format: "der",
    type: "pkcs8",
  });
}

export function publicKeyBase64(privateKey) {
  const spki = createPublicKey(privateKey).export({ format: "der", type: "spki" });
  return spki.subarray(SPKI_ED25519_PREFIX.length).toString("base64");
}

function publicKeyFromBase64(value) {
  const raw = decodeKeyBytes(value, "The update public key");
  return createPublicKey({
    key: Buffer.concat([SPKI_ED25519_PREFIX, raw]),
    format: "der",
    type: "spki",
  });
}

function isPlainVersion(value) {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value);
}

function isValidArchiveUrl(value) {
  if (Buffer.byteLength(value) === 0 || Buffer.byteLength(value) > MAX_ARCHIVE_URL_BYTES) {
    return false;
  }
  if (/[\u0000- \u007f]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.length > 0;
  } catch {
    return false;
  }
}

// Rejects anything the installed app's verifier would, so a bad feed fails
// the release instead of every installed app's update check.
export function validateRelease(release) {
  const problems = [];
  const bundleIdBytes = Buffer.byteLength(release.bundle_id ?? "");
  if (bundleIdBytes === 0 || bundleIdBytes > 128) problems.push("bundle_id must be 1-128 bytes");
  if (!isPlainVersion(release.version ?? "")) {
    problems.push(`version "${release.version}" must be a plain X.Y.Z without leading zeros`);
  }
  if (!TARGETS.includes(release.target))
    problems.push(`target must be one of ${TARGETS.join(", ")}`);
  if (!isValidArchiveUrl(release.archive_url ?? "")) {
    problems.push("archive_url must be an https URL without spaces or control characters");
  }
  if (
    !Number.isSafeInteger(release.archive_bytes) ||
    release.archive_bytes <= 0 ||
    release.archive_bytes > MAX_ARCHIVE_BYTES
  ) {
    problems.push("archive_bytes must be a positive size up to 8 GiB");
  }
  if (!/^[0-9a-f]{64}$/.test(release.sha256 ?? "")) {
    problems.push("sha256 must be 64 lowercase hex characters");
  }
  if (Buffer.byteLength(release.release_notes ?? "") > MAX_RELEASE_NOTES_BYTES) {
    problems.push("release_notes must be at most 16 KiB");
  }
  if (problems.length > 0) throw new Error(`Invalid update release: ${problems.join("; ")}`);
}

export function createUpdateFeed(release, privateKey) {
  const normalized = { ...release, release_notes: release.release_notes ?? "" };
  validateRelease(normalized);
  const payload = Buffer.from(
    JSON.stringify(Object.fromEntries(PAYLOAD_FIELDS.map((field) => [field, normalized[field]]))),
  );
  if (payload.length > MAX_PAYLOAD_BYTES) throw new Error("The update payload exceeds 32 KiB");
  const signature = sign(null, payload, privateKey);
  // Same layout `native update sign` writes.
  const envelope = `${JSON.stringify(
    { payload: payload.toString("base64"), signature: signature.toString("base64") },
    null,
    2,
  )}\n`;
  if (Buffer.byteLength(envelope) > MAX_ENVELOPE_BYTES) {
    throw new Error("The update feed exceeds 64 KiB");
  }
  return envelope;
}

function hasOnlyKeys(value, allowed) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).every((key) => allowed.includes(key))
  );
}

export function verifyUpdateFeed(envelopeText, publicKey) {
  if (Buffer.byteLength(envelopeText) > MAX_ENVELOPE_BYTES) {
    throw new Error("The update feed exceeds 64 KiB");
  }
  const envelope = JSON.parse(envelopeText);
  if (
    !hasOnlyKeys(envelope, ["payload", "signature"]) ||
    typeof envelope.payload !== "string" ||
    typeof envelope.signature !== "string"
  ) {
    throw new Error("The update feed must hold exactly a payload and a signature");
  }
  const payload = Buffer.from(envelope.payload, "base64");
  const signature = Buffer.from(envelope.signature, "base64");
  if (!verify(null, payload, publicKeyFromBase64(publicKey), signature)) {
    throw new Error("The update feed signature does not verify");
  }
  const release = JSON.parse(payload.toString("utf8"));
  if (!hasOnlyKeys(release, PAYLOAD_FIELDS)) {
    throw new Error("The update payload has unknown fields");
  }
  validateRelease(release);
  return release;
}

async function sha256File(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

async function main() {
  const { values } = parseArgs({
    options: {
      archive: { type: "string" },
      url: { type: "string" },
      output: { type: "string" },
      notes: { type: "string", default: "" },
      target: { type: "string", default: "macos-aarch64" },
      manifest: {
        type: "string",
        default: path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "app.json"),
      },
    },
  });
  for (const name of ["archive", "url", "output"]) {
    if (!values[name]) throw new Error(`--${name} is required`);
  }

  const manifest = JSON.parse(readFileSync(values.manifest, "utf8"));
  const configuredKey = manifest.updates?.public_key;
  if (!configuredKey) throw new Error(`${values.manifest} has no updates.public_key`);

  const privateKey = privateKeyFromSeed(process.env.NATIVE_UPDATE_PRIVATE_KEY);
  if (publicKeyBase64(privateKey) !== configuredKey) {
    throw new Error(
      `NATIVE_UPDATE_PRIVATE_KEY does not match updates.public_key in ${values.manifest}`,
    );
  }

  const envelope = createUpdateFeed(
    {
      bundle_id: manifest.id,
      version: manifest.version,
      target: values.target,
      archive_url: values.url,
      archive_bytes: statSync(values.archive).size,
      sha256: await sha256File(values.archive),
      release_notes: values.notes,
    },
    privateKey,
  );
  const release = verifyUpdateFeed(envelope, configuredKey);
  writeFileSync(values.output, envelope);
  console.info(
    `[update-feed] signed ${manifest.display_name ?? manifest.id} ${release.version} ` +
      `(${release.archive_bytes} bytes, sha256 ${release.sha256}) into ${values.output}`,
  );
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(`[update-feed] ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  });
}
