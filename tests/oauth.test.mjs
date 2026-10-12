import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import test, { beforeEach } from "node:test";
import { resetDb, rowsOf } from "./support/fake-db.mjs";
import {
  MCP_SCOPE,
  consumeAuthorizationCode,
  createAuthorizationCode,
  getClient,
  isAllowedRedirectUri,
  issueTokens,
  registerClient,
  rotateRefreshToken,
  verifyAccessToken,
} from "../lib/oauth.ts";
import { validateAuthorizeRequest } from "../app/oauth/authorize/validate.ts";

const REDIRECT_URI = "http://127.0.0.1:33418/callback";
const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function pkce() {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
}

async function authorize(client, { challenge }) {
  return createAuthorizationCode({
    clientId: client.id,
    redirectUri: REDIRECT_URI,
    codeChallenge: challenge,
    scope: MCP_SCOPE,
  });
}

/** Every token-shaped string the store holds, to check none is kept in the clear. */
const storedValues = (model) => JSON.stringify(rowsOf(model));

beforeEach(() => resetDb());

test("redirect URIs must be https or loopback http", () => {
  for (const uri of [
    "https://claude.ai/api/mcp/auth_callback",
    "http://localhost:33418/callback",
    "http://127.0.0.1/callback",
    "http://[::1]:8080/callback",
  ]) {
    assert.equal(isAllowedRedirectUri(uri), true, uri);
  }
  for (const uri of [
    "http://evil.example/callback",
    "http://localhost.evil.example/callback",
    "http://127.0.0.1.nip.io/callback",
    "http://localhost@evil.example/callback",
    "javascript:alert(1)",
    "file:///etc/passwd",
    "custom-app://callback",
    "not a url",
    "",
  ]) {
    assert.equal(isAllowedRedirectUri(uri), false, uri);
  }
});

test("registration prunes clients that were never approved within a day", async () => {
  const old = new Date(Date.now() - 2 * DAY);
  rowsOf("oAuthClient").push(
    { id: "abandoned", name: "a", redirectUris: [], createdAt: old, authorizedAt: null },
    { id: "approved", name: "b", redirectUris: [], createdAt: old, authorizedAt: old },
    { id: "pending", name: "c", redirectUris: [], createdAt: new Date(), authorizedAt: null },
  );
  const client = await registerClient("Claude", [REDIRECT_URI]);
  assert.deepEqual(
    rowsOf("oAuthClient").map((row) => row.id),
    ["approved", "pending", client.id],
  );
});

test("a stored client exposes only its string redirect URIs", async () => {
  rowsOf("oAuthClient").push({
    id: "legacy",
    name: "Legacy",
    redirectUris: [REDIRECT_URI, 42, null],
    createdAt: new Date(),
  });
  assert.deepEqual((await getClient("legacy")).redirectUris, [REDIRECT_URI]);
  assert.equal(await getClient("missing"), null);
});

test("an authorization code is stored by hash and marks the client approved", async () => {
  const client = await registerClient("Claude", [REDIRECT_URI]);
  const code = await authorize(client, pkce());
  assert.match(code, /^tac_/);
  assert.equal(rowsOf("oAuthCode")[0].code, sha256(code));
  assert.ok(!storedValues("oAuthCode").includes(code));
  assert.ok(rowsOf("oAuthClient")[0].authorizedAt instanceof Date);
});

test("an authorization code redeems once, with the matching PKCE verifier", async () => {
  const client = await registerClient("Claude", [REDIRECT_URI]);
  const { verifier, challenge } = pkce();
  const code = await authorize(client, { challenge });
  const redeem = (overrides = {}) =>
    consumeAuthorizationCode({
      code,
      clientId: client.id,
      redirectUri: REDIRECT_URI,
      codeVerifier: verifier,
      ...overrides,
    });
  assert.deepEqual(await redeem(), { scope: MCP_SCOPE });
  assert.equal(await redeem(), null);
});

test("a failed redemption burns the code, so a verifier can't be guessed", async () => {
  const client = await registerClient("Claude", [REDIRECT_URI]);
  for (const mismatch of [
    { codeVerifier: pkce().verifier },
    { clientId: "another-client" },
    { redirectUri: "http://127.0.0.1:9999/callback" },
  ]) {
    const { verifier, challenge } = pkce();
    const code = await authorize(client, { challenge });
    const input = { code, clientId: client.id, redirectUri: REDIRECT_URI, codeVerifier: verifier };
    assert.equal(await consumeAuthorizationCode({ ...input, ...mismatch }), null);
    assert.equal(await consumeAuthorizationCode(input), null, JSON.stringify(mismatch));
  }
});

test("an expired authorization code is refused", async () => {
  const client = await registerClient("Claude", [REDIRECT_URI]);
  const { verifier, challenge } = pkce();
  const code = await authorize(client, { challenge });
  rowsOf("oAuthCode")[0].expiresAt = new Date(Date.now() - 1);
  const input = { code, clientId: client.id, redirectUri: REDIRECT_URI, codeVerifier: verifier };
  assert.equal(await consumeAuthorizationCode(input), null);
});

test("the verifier must hash to the challenge; sending the challenge itself fails", async () => {
  // A "plain" PKCE client would send the challenge as the verifier.
  const client = await registerClient("Claude", [REDIRECT_URI]);
  const { challenge } = pkce();
  const code = await authorize(client, { challenge });
  const input = { code, clientId: client.id, redirectUri: REDIRECT_URI, codeVerifier: challenge };
  assert.equal(await consumeAuthorizationCode(input), null);
});

test("issued tokens are stored by hash and verify until they expire", async () => {
  const client = await registerClient("Claude", [REDIRECT_URI]);
  const tokens = await issueTokens(client.id, MCP_SCOPE);
  assert.match(tokens.accessToken, /^tat_/);
  assert.match(tokens.refreshToken, /^tar_/);
  assert.equal(tokens.expiresIn, 3600);
  assert.ok(!storedValues("oAuthToken").includes(tokens.accessToken));
  assert.ok(!storedValues("oAuthToken").includes(tokens.refreshToken));

  const verified = await verifyAccessToken(tokens.accessToken);
  assert.deepEqual(
    { ...verified, expiresAt: undefined },
    { clientId: client.id, clientName: "Claude", scopes: [MCP_SCOPE], expiresAt: undefined },
  );
  assert.ok(Math.abs(verified.expiresAt * 1000 - (Date.now() + HOUR)) < 2000);

  assert.equal(await verifyAccessToken("tat_unknown"), null);
  rowsOf("oAuthToken")[0].accessExpiresAt = new Date(Date.now() - 1);
  assert.equal(await verifyAccessToken(tokens.accessToken), null);
});

test("refreshing rotates both tokens and retires the old access token", async () => {
  const client = await registerClient("Claude", [REDIRECT_URI]);
  const first = await issueTokens(client.id, MCP_SCOPE);
  const second = await rotateRefreshToken(first.refreshToken, client.id);
  assert.ok(second);
  assert.notEqual(second.accessToken, first.accessToken);
  assert.notEqual(second.refreshToken, first.refreshToken);
  assert.equal(await verifyAccessToken(first.accessToken), null);
  assert.ok(await verifyAccessToken(second.accessToken));
  const [oldRow, newRow] = rowsOf("oAuthToken");
  assert.equal(newRow.familyId, oldRow.familyId);
});

test("replaying a rotated refresh token revokes the whole family", async () => {
  const client = await registerClient("Claude", [REDIRECT_URI]);
  const first = await issueTokens(client.id, MCP_SCOPE);
  const second = await rotateRefreshToken(first.refreshToken, client.id);
  const unrelated = await issueTokens(client.id, MCP_SCOPE);

  // Someone else used the old refresh token: assume it was stolen.
  assert.equal(await rotateRefreshToken(first.refreshToken, client.id), null);
  assert.equal(await verifyAccessToken(second.accessToken), null);
  assert.equal(await rotateRefreshToken(second.refreshToken, client.id), null);
  // Another login of the same client is a different family and survives.
  assert.ok(await verifyAccessToken(unrelated.accessToken));
});

test("two concurrent refreshes with one token can't both succeed", async () => {
  const client = await registerClient("Claude", [REDIRECT_URI]);
  const { refreshToken } = await issueTokens(client.id, MCP_SCOPE);
  const results = await Promise.all([
    rotateRefreshToken(refreshToken, client.id),
    rotateRefreshToken(refreshToken, client.id),
  ]);
  assert.ok(results.filter(Boolean).length <= 1, "both refreshes succeeded");
  assert.equal(await rotateRefreshToken(refreshToken, client.id), null);
});

test("a refresh token only works for its own client, and only until it expires", async () => {
  const victim = await registerClient("Claude", [REDIRECT_URI]);
  const attacker = await registerClient("Other", [REDIRECT_URI]);
  const tokens = await issueTokens(victim.id, MCP_SCOPE);
  assert.equal(await rotateRefreshToken(tokens.refreshToken, attacker.id), null);
  // The attempt doesn't revoke the victim's tokens.
  assert.ok(await verifyAccessToken(tokens.accessToken));

  rowsOf("oAuthToken")[0].refreshExpiresAt = new Date(Date.now() - 1);
  assert.equal(await rotateRefreshToken(tokens.refreshToken, victim.id), null);
});

test("an authorize request must name a registered client and one of its redirect URIs", async () => {
  const client = await registerClient("Claude", [REDIRECT_URI]);
  const valid = {
    response_type: "code",
    client_id: client.id,
    redirect_uri: REDIRECT_URI,
    code_challenge: pkce().challenge,
    code_challenge_method: "S256",
  };
  for (const params of [
    { ...valid, client_id: undefined },
    { ...valid, redirect_uri: undefined },
    { ...valid, client_id: "unknown" },
    // Allowed by policy but not registered by this client.
    { ...valid, redirect_uri: "http://127.0.0.1:9999/callback" },
  ]) {
    assert.deepEqual(await validateAuthorizeRequest(params), { status: "invalid" });
  }

  // Registered before the policy tightened, or copied from another target.
  rowsOf("oAuthClient").push({
    id: "legacy",
    name: "Legacy",
    redirectUris: ["http://evil.example/callback"],
    createdAt: new Date(),
  });
  assert.deepEqual(
    await validateAuthorizeRequest({
      ...valid,
      client_id: "legacy",
      redirect_uri: "http://evil.example/callback",
    }),
    { status: "invalid" },
  );
});

test("other authorize errors go back to the client's redirect URI with its state", async () => {
  const client = await registerClient("Claude", [REDIRECT_URI]);
  const valid = {
    response_type: "code",
    client_id: client.id,
    redirect_uri: REDIRECT_URI,
    state: "xyz",
    code_challenge: pkce().challenge,
    code_challenge_method: "S256",
  };
  const errorOf = async (params) => {
    const result = await validateAuthorizeRequest(params);
    assert.equal(result.status, "error_redirect");
    const url = new URL(result.url);
    assert.equal(`${url.origin}${url.pathname}`, REDIRECT_URI);
    assert.equal(url.searchParams.get("state"), "xyz");
    return url.searchParams.get("error");
  };
  assert.equal(await errorOf({ ...valid, response_type: "token" }), "unsupported_response_type");
  assert.equal(await errorOf({ ...valid, code_challenge: undefined }), "invalid_request");
  assert.equal(await errorOf({ ...valid, code_challenge_method: "plain" }), "invalid_request");
  assert.equal(await errorOf({ ...valid, scope: `${MCP_SCOPE} admin` }), "invalid_scope");
});

test("a valid authorize request is granted the MCP scope only", async () => {
  const client = await registerClient("Claude", [REDIRECT_URI]);
  const { challenge } = pkce();
  const params = {
    response_type: "code",
    client_id: client.id,
    redirect_uri: REDIRECT_URI,
    code_challenge: challenge,
    code_challenge_method: "S256",
  };
  assert.deepEqual(await validateAuthorizeRequest(params), {
    status: "ok",
    clientId: client.id,
    clientName: "Claude",
    redirectUri: REDIRECT_URI,
    state: null,
    codeChallenge: challenge,
    scope: MCP_SCOPE,
  });
  const scoped = await validateAuthorizeRequest({ ...params, scope: ` ${MCP_SCOPE} ` });
  assert.equal(scoped.scope, MCP_SCOPE);
});
