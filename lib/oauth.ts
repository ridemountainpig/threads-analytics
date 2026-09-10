import "server-only";

import { createHash, randomBytes } from "crypto";
import { db } from "./db";

export const MCP_SCOPE = "analytics:read";

const CODE_TTL_MS = 10 * 60 * 1000;
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const UNAUTHORIZED_CLIENT_TTL_MS = 24 * 60 * 60 * 1000;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function newToken(prefix: string): string {
  return `${prefix}_${randomBytes(32).toString("base64url")}`;
}

export function isAllowedRedirectUri(uri: string): boolean {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (url.protocol === "https:") return true;
  // Loopback redirect URIs are the standard flow for local MCP clients.
  return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
}

export async function registerClient(name: string, redirectUris: string[]) {
  // Registration is unauthenticated (DCR); prune clients that never got approved.
  await db.oAuthClient.deleteMany({
    where: {
      authorizedAt: null,
      createdAt: { lt: new Date(Date.now() - UNAUTHORIZED_CLIENT_TTL_MS) },
    },
  });
  return db.oAuthClient.create({
    data: { name, redirectUris },
  });
}

export async function getClient(clientId: string) {
  const client = await db.oAuthClient.findUnique({ where: { id: clientId } });
  if (!client) return null;
  const uris = Array.isArray(client.redirectUris)
    ? client.redirectUris.filter((u): u is string => typeof u === "string")
    : [];
  return { id: client.id, name: client.name, redirectUris: uris, createdAt: client.createdAt };
}

export async function createAuthorizationCode(input: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scope: string;
}): Promise<string> {
  const code = newToken("tac");
  const now = Date.now();
  await Promise.all([
    db.oAuthCode.deleteMany({ where: { expiresAt: { lt: new Date(now) } } }),
    db.oAuthCode.create({
      data: {
        code: sha256(code),
        clientId: input.clientId,
        redirectUri: input.redirectUri,
        codeChallenge: input.codeChallenge,
        scope: input.scope,
        expiresAt: new Date(now + CODE_TTL_MS),
      },
    }),
    db.oAuthClient.update({
      where: { id: input.clientId },
      data: { authorizedAt: new Date(now) },
    }),
  ]);
  return code;
}

export async function consumeAuthorizationCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<{ scope: string } | null> {
  const hashed = sha256(input.code);
  // Single use: the delete is the atomic consume, so concurrent replays race
  // for one row and only the winner gets it back to validate.
  const row = await db.oAuthCode.delete({ where: { code: hashed } }).catch(() => null);
  if (!row) return null;

  if (row.expiresAt < new Date()) return null;
  if (row.clientId !== input.clientId) return null;
  if (row.redirectUri !== input.redirectUri) return null;

  const challenge = createHash("sha256").update(input.codeVerifier).digest("base64url");
  if (challenge !== row.codeChallenge) return null;

  return { scope: row.scope };
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
}

export async function issueTokens(
  clientId: string,
  scope: string,
  familyId?: string,
): Promise<IssuedTokens> {
  const accessToken = newToken("tat");
  const refreshToken = newToken("tar");
  const now = Date.now();
  await Promise.all([
    db.oAuthToken.deleteMany({ where: { refreshExpiresAt: { lt: new Date(now) } } }),
    db.oAuthToken.create({
      data: {
        accessToken: sha256(accessToken),
        refreshToken: sha256(refreshToken),
        clientId,
        scope,
        familyId: familyId ?? randomBytes(16).toString("base64url"),
        accessExpiresAt: new Date(now + ACCESS_TOKEN_TTL_MS),
        refreshExpiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
      },
    }),
  ]);
  return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_MS / 1000, scope };
}

export async function rotateRefreshToken(
  refreshToken: string,
  clientId: string,
): Promise<IssuedTokens | null> {
  const row = await db.oAuthToken.findUnique({ where: { refreshToken: sha256(refreshToken) } });
  if (!row || row.clientId !== clientId || row.refreshExpiresAt < new Date()) return null;
  if (row.rotatedAt) {
    // Replay of an already-rotated refresh token: the token was likely stolen,
    // so revoke the entire family.
    await db.oAuthToken.deleteMany({ where: { familyId: row.familyId } });
    return null;
  }
  // Conditional update is the atomic claim: a concurrent replay of the same
  // token loses the race here instead of both passing the rotatedAt check.
  const claimed = await db.oAuthToken.updateMany({
    where: { id: row.id, rotatedAt: null },
    data: { rotatedAt: new Date() },
  });
  if (claimed.count === 0) {
    await db.oAuthToken.deleteMany({ where: { familyId: row.familyId } });
    return null;
  }
  return issueTokens(clientId, row.scope, row.familyId);
}

export interface VerifiedAccessToken {
  clientId: string;
  clientName: string;
  scopes: string[];
  expiresAt: number;
}

export async function verifyAccessToken(accessToken: string): Promise<VerifiedAccessToken | null> {
  const row = await db.oAuthToken.findUnique({
    where: { accessToken: sha256(accessToken) },
    include: { client: true },
  });
  if (!row || row.rotatedAt || row.accessExpiresAt < new Date()) return null;
  db.oAuthToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return {
    clientId: row.clientId,
    clientName: row.client.name,
    scopes: row.scope.split(" "),
    expiresAt: Math.floor(row.accessExpiresAt.getTime() / 1000),
  };
}

export async function listClients() {
  // Only clients the user has actually approved; DCR is open to the internet.
  const clients = await db.oAuthClient.findMany({
    where: { authorizedAt: { not: null } },
    orderBy: { createdAt: "asc" },
  });
  const lastUsed = await db.oAuthToken.groupBy({
    by: ["clientId"],
    _max: { lastUsedAt: true },
  });
  const lastUsedByClient = new Map(lastUsed.map((t) => [t.clientId, t._max.lastUsedAt]));
  return clients.map((c) => ({
    id: c.id,
    name: c.name,
    authorizedAt: c.authorizedAt ?? c.createdAt,
    lastUsedAt: lastUsedByClient.get(c.id) ?? null,
  }));
}

export async function revokeClient(clientId: string): Promise<void> {
  await db.oAuthClient.deleteMany({ where: { id: clientId } });
}
