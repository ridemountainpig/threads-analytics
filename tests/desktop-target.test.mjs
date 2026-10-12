import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { NextRequest } from "next/server.js";
import { resetDb } from "./support/fake-db.mjs";

// The desktop build differs from the web one in its security model: the
// server only listens on loopback and has no login. lib/runtime-target.ts
// reads the target when it is first imported, so set it before anything
// imports it.
process.env.NEXT_PUBLIC_RUNTIME_TARGET = "desktop";
const { default: proxy } = await import("../proxy.ts");
const { isAllowedRedirectUri } = await import("../lib/oauth.ts");
const { POST: register } = await import("../app/api/oauth/register/route.ts");

beforeEach(() => resetDb());

const request = (host, path = "/dashboard/overview") =>
  new NextRequest(`http://127.0.0.1:41234${path}`, { headers: host ? { host } : {} });

test("the desktop server answers loopback hosts without a login", () => {
  for (const host of ["127.0.0.1:41234", "localhost:41234", "LOCALHOST", "[::1]:41234"]) {
    const response = proxy(request(host));
    assert.equal(response.headers.get("x-middleware-next"), "1", host);
  }
});

test("any other Host header is refused, so DNS-rebinding pages get nothing", async () => {
  for (const host of [
    "attacker.example",
    "attacker.example:41234",
    "127.0.0.1.attacker.example",
    "localhost.attacker.example:41234",
    "127.0.0.2:41234",
    null,
  ]) {
    const response = proxy(request(host, "/api/export"));
    assert.equal(response.status, 403, String(host));
    assert.deepEqual(await response.json(), { error: "Forbidden" });
  }
});

test("desktop OAuth clients must redirect to loopback", () => {
  // An https redirect could only belong to a website, which could collect
  // codes from a consent page that needs no login here.
  assert.equal(isAllowedRedirectUri("https://claude.ai/api/mcp/auth_callback"), false);
  assert.equal(isAllowedRedirectUri("http://127.0.0.1:33418/callback"), true);
  assert.equal(isAllowedRedirectUri("http://localhost:33418/callback"), true);
});

test("desktop registration refuses https redirect URIs", async () => {
  const response = await register(
    new Request("http://127.0.0.1:41234/api/oauth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ redirect_uris: ["https://claude.ai/api/mcp/auth_callback"] }),
    }),
  );
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, "invalid_redirect_uri");
  assert.match(body.error_description, /loopback/);
});
