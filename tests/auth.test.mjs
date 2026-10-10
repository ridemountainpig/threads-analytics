import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test, { beforeEach } from "node:test";
import { resetDb, rowsOf } from "./support/fake-db.mjs";
import { createSession, verifyPassword } from "../lib/auth.ts";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

beforeEach(() => {
  resetDb();
  process.env.APP_PASSWORD = "correct horse battery staple";
  process.env.TOKEN_ENCRYPTION_KEY = "test-encryption-key";
});

test("only the configured password logs in", async () => {
  assert.equal(await verifyPassword("correct horse battery staple"), true);
  assert.equal(await verifyPassword("correct horse battery"), false);
  assert.equal(await verifyPassword("correct horse battery staple "), false);
  assert.equal(await verifyPassword(""), false);
});

test("login fails closed when the server is not configured", async () => {
  delete process.env.APP_PASSWORD;
  assert.equal(await verifyPassword(""), false);
  assert.equal(await verifyPassword("undefined"), false);

  process.env.APP_PASSWORD = "correct horse battery staple";
  delete process.env.TOKEN_ENCRYPTION_KEY;
  assert.equal(await verifyPassword("correct horse battery staple"), false);
});

test("sessions are stored by hash, so a database dump holds no live token", async () => {
  const token = await createSession();
  assert.match(token, /^[0-9a-f]{64}$/);
  const [session] = rowsOf("session");
  assert.equal(session.token, sha256(token));
  assert.ok(!JSON.stringify(rowsOf("session")).includes(token));
  // Seven days from now.
  const days = (session.expiresAt.getTime() - Date.now()) / (24 * 60 * 60_000);
  assert.ok(Math.abs(days - 7) < 0.01, `${days} days`);
});

test("creating a session prunes expired ones", async () => {
  rowsOf("session").push(
    { token: "expired", expiresAt: new Date(Date.now() - 1000) },
    { token: "live", expiresAt: new Date(Date.now() + 60_000) },
  );
  await createSession();
  assert.deepEqual(
    rowsOf("session")
      .map((session) => session.token)
      .filter((token) => token === "expired" || token === "live"),
    ["live"],
  );
});
