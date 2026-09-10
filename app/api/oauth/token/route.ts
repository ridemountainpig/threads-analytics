import { NextResponse } from "next/server";
import { consumeAuthorizationCode, getClient, issueTokens, rotateRefreshToken } from "@/lib/oauth";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function errorResponse(error: string, description: string, status = 400) {
  return NextResponse.json(
    { error, error_description: description },
    { status, headers: { ...CORS, "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("invalid_request", "Body must be application/x-www-form-urlencoded");
  }

  const param = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value : null;
  };

  const grantType = param("grant_type");
  const clientId = param("client_id");
  if (!clientId || !(await getClient(clientId))) {
    return errorResponse("invalid_client", "Unknown client_id", 401);
  }

  if (grantType === "authorization_code") {
    const code = param("code");
    const redirectUri = param("redirect_uri");
    const codeVerifier = param("code_verifier");
    if (!code || !redirectUri || !codeVerifier) {
      return errorResponse("invalid_request", "code, redirect_uri and code_verifier are required");
    }
    const consumed = await consumeAuthorizationCode({ code, clientId, redirectUri, codeVerifier });
    if (!consumed) {
      return errorResponse("invalid_grant", "Authorization code is invalid or expired");
    }
    const tokens = await issueTokens(clientId, consumed.scope);
    return tokenResponse(tokens);
  }

  if (grantType === "refresh_token") {
    const refreshToken = param("refresh_token");
    if (!refreshToken) {
      return errorResponse("invalid_request", "refresh_token is required");
    }
    const tokens = await rotateRefreshToken(refreshToken, clientId);
    if (!tokens) {
      return errorResponse("invalid_grant", "Refresh token is invalid or expired");
    }
    return tokenResponse(tokens);
  }

  return errorResponse("unsupported_grant_type", "Use authorization_code or refresh_token");
}

function tokenResponse(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
}) {
  return NextResponse.json(
    {
      access_token: tokens.accessToken,
      token_type: "Bearer",
      expires_in: tokens.expiresIn,
      refresh_token: tokens.refreshToken,
      scope: tokens.scope,
    },
    { headers: { ...CORS, "Cache-Control": "no-store", Pragma: "no-cache" } },
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
