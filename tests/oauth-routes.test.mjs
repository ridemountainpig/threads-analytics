import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import test, { beforeEach } from "node:test";
import { resetDb, rowsOf } from "./support/fake-db.mjs";
import { MCP_SCOPE, createAuthorizationCode, verifyAccessToken } from "../lib/oauth.ts";
import { POST as tokenEndpoint } from "../app/api/oauth/token/route.ts";
import { POST as registerEndpoint } from "../app/api/oauth/register/route.ts";

const REDIRECT_URI = "http://127.0.0.1:33418/callback";

beforeEach(() => resetDb());

// Registration is rate limited per IP for the life of the module, so each
// test registers from an address of its own.
let nextIp = 1;
const freshIp = () => `198.51.100.${nextIp++}`;

function register(body, ip = freshIp()) {
  return registerEndpoint(
    new Request("http://localhost/api/oauth/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function token(fields) {
  return tokenEndpoint(
    new Request("http://localhost/api/oauth/token", {
      method: "POST",
      body: new URLSearchParams(fields),
    }),
  );
}

async function registeredClient() {
  const response = await register({ client_name: "Claude", redirect_uris: [REDIRECT_URI] });
  return (await response.json()).client_id;
}

async function authorizationCode(clientId) {
  const verifier = randomBytes(32).toString("base64url");
  const code = await createAuthorizationCode({
    clientId,
    redirectUri: REDIRECT_URI,
    codeChallenge: createHash("sha256").update(verifier).digest("base64url"),
    scope: MCP_SCOPE,
  });
  return { code, verifier };
}

async function expectError(response, status, error) {
  assert.equal(response.status, status);
  assert.equal((await response.json()).error, error);
}

test("a registered client exchanges its code for tokens", async () => {
  const clientId = await registeredClient();
  const { code, verifier } = await authorizationCode(clientId);
  const response = await token({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.equal(body.token_type, "Bearer");
  assert.equal(body.scope, MCP_SCOPE);
  assert.equal(body.expires_in, 3600);
  assert.equal((await verifyAccessToken(body.access_token)).clientId, clientId);
  assert.match(body.refresh_token, /^tar_/);
});

test("a code exchange needs every field, and a code works once", async () => {
  const clientId = await registeredClient();
  const { code, verifier } = await authorizationCode(clientId);
  const fields = {
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  };
  for (const missing of ["code", "redirect_uri", "code_verifier"]) {
    const { [missing]: _, ...rest } = fields;
    await expectError(await token(rest), 400, "invalid_request");
  }
  assert.equal((await token(fields)).status, 200);
  await expectError(await token(fields), 400, "invalid_grant");
});

test("the token endpoint only talks to registered clients", async () => {
  await expectError(await token({ grant_type: "refresh_token" }), 401, "invalid_client");
  await expectError(
    await token({ grant_type: "refresh_token", client_id: "unknown", refresh_token: "tar_x" }),
    401,
    "invalid_client",
  );
});

test("a refresh token rotates once; replaying it is refused", async () => {
  const clientId = await registeredClient();
  const { code, verifier } = await authorizationCode(clientId);
  const issued = await (
    await token({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    })
  ).json();

  const refresh = { grant_type: "refresh_token", client_id: clientId };
  await expectError(await token(refresh), 400, "invalid_request");
  const rotated = await token({ ...refresh, refresh_token: issued.refresh_token });
  assert.equal(rotated.status, 200);
  await expectError(
    await token({ ...refresh, refresh_token: issued.refresh_token }),
    400,
    "invalid_grant",
  );
});

test("only the code and refresh grants are supported, as form posts", async () => {
  const clientId = await registeredClient();
  for (const grantType of ["password", "client_credentials", "implicit", ""]) {
    await expectError(
      await token({ grant_type: grantType, client_id: clientId }),
      400,
      "unsupported_grant_type",
    );
  }
  const json = await tokenEndpoint(
    new Request("http://localhost/api/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ grant_type: "authorization_code", client_id: clientId }),
    }),
  );
  await expectError(json, 400, "invalid_request");
});

test("registration returns a public client for PKCE flows", async () => {
  const response = await register({
    client_name: `  ${"A".repeat(120)}  `,
    redirect_uris: [REDIRECT_URI, "https://claude.ai/api/mcp/auth_callback"],
  });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.client_name, "A".repeat(100));
  assert.equal(body.token_endpoint_auth_method, "none");
  assert.deepEqual(body.grant_types, ["authorization_code", "refresh_token"]);
  assert.deepEqual(rowsOf("oAuthClient")[0].redirectUris, body.redirect_uris);

  const unnamed = await (await register({ redirect_uris: [REDIRECT_URI] })).json();
  assert.equal(unnamed.client_name, "Unnamed MCP client");
});

test("registration refuses redirect URIs outside the policy", async () => {
  for (const redirectUris of [
    undefined,
    [],
    REDIRECT_URI,
    [42],
    [REDIRECT_URI, "http://evil.example/callback"],
    Array.from({ length: 11 }, (_, i) => `http://127.0.0.1:${3000 + i}/callback`),
  ]) {
    await expectError(
      await register({ client_name: "x", redirect_uris: redirectUris }),
      400,
      "invalid_redirect_uri",
    );
  }
  await expectError(await register("not json"), 400, "invalid_client_metadata");
  assert.equal(rowsOf("oAuthClient").length, 0);
});

test("one address can register five clients per window", async () => {
  const ip = freshIp();
  const body = { redirect_uris: [REDIRECT_URI] };
  for (let i = 0; i < 5; i++) assert.equal((await register(body, ip)).status, 201);
  assert.equal((await register(body, ip)).status, 429);
  assert.equal((await register(body)).status, 201);
});
