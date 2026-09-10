import { NextResponse } from "next/server";
import { createIpRateLimiter, getClientIp } from "@/lib/login-rate-limit";
import { isAllowedRedirectUri, registerClient } from "@/lib/oauth";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function errorResponse(error: string, description: string, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status, headers: CORS });
}

// Registration is unauthenticated (RFC 7591), so cap how fast one IP can create clients.
const registrationLimiter = createIpRateLimiter(5, 15 * 60 * 1000);

export async function POST(request: Request) {
  if (!registrationLimiter.consume(getClientIp(request.headers))) {
    return errorResponse("invalid_request", "Too many registration requests, try again later", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_client_metadata", "Request body must be JSON");
  }

  const metadata = (body ?? {}) as Record<string, unknown>;
  const redirectUris = metadata.redirect_uris;
  if (
    !Array.isArray(redirectUris) ||
    redirectUris.length === 0 ||
    redirectUris.length > 10 ||
    !redirectUris.every((u): u is string => typeof u === "string" && isAllowedRedirectUri(u))
  ) {
    return errorResponse(
      "invalid_redirect_uri",
      "redirect_uris must be https or loopback http URLs",
    );
  }

  const name =
    typeof metadata.client_name === "string" && metadata.client_name.trim()
      ? metadata.client_name.trim().slice(0, 100)
      : "Unnamed MCP client";

  const client = await registerClient(name, redirectUris);

  return NextResponse.json(
    {
      client_id: client.id,
      client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
      client_name: name,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    },
    { status: 201, headers: CORS },
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
