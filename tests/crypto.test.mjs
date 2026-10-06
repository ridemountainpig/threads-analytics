import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { decryptToken, encryptToken } from "../lib/crypto.ts";

const KEY = "test-encryption-key";

beforeEach(() => {
  process.env.TOKEN_ENCRYPTION_KEY = KEY;
});

/** Flips one bit of the decoded payload at `index` (negative counts from the end). */
function flipBit(ciphertext, index) {
  const bytes = Buffer.from(ciphertext, "base64");
  bytes[index < 0 ? bytes.length + index : index] ^= 0x01;
  return bytes.toString("base64");
}

test("a token survives the round trip", () => {
  for (const token of ["THAAG-long-lived-token", "", "含 Unicode 的字串 🔑"]) {
    assert.equal(decryptToken(encryptToken(token)), token);
  }
});

test("each encryption uses a fresh IV, laid out as IV, tag, then ciphertext", () => {
  const first = encryptToken("same token");
  const second = encryptToken("same token");
  assert.notEqual(first, second);
  assert.notDeepEqual(
    Buffer.from(first, "base64").subarray(0, 12),
    Buffer.from(second, "base64").subarray(0, 12),
  );
  assert.equal(Buffer.from(first, "base64").length, 12 + 16 + Buffer.byteLength("same token"));
});

test("any tampering is detected instead of decrypting to garbage", () => {
  const ciphertext = encryptToken("THAAG-long-lived-token");
  for (const [part, index] of [
    ["IV", 0],
    ["auth tag", 12],
    ["ciphertext", -1],
  ]) {
    assert.throws(() => decryptToken(flipBit(ciphertext, index)), Error, part);
  }
  assert.throws(() => decryptToken(ciphertext.slice(0, 20)), /Invalid or corrupted/);
});

test("a token encrypted under another key does not decrypt", () => {
  const ciphertext = encryptToken("THAAG-long-lived-token");
  process.env.TOKEN_ENCRYPTION_KEY = "a-different-key";
  assert.throws(() => decryptToken(ciphertext));
});

test("encryption refuses to run without a key", () => {
  delete process.env.TOKEN_ENCRYPTION_KEY;
  assert.throws(() => encryptToken("token"), /TOKEN_ENCRYPTION_KEY is not set/);
  assert.throws(() => decryptToken("AAAA"), /TOKEN_ENCRYPTION_KEY is not set/);
});
