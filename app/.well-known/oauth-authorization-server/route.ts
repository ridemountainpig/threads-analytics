import { getPublicOrigin, metadataCorsOptionsRequestHandler } from "mcp-handler";
import { MCP_SCOPE } from "@/lib/oauth";

export function GET(request: Request) {
  const base = getPublicOrigin(request);
  return Response.json(
    {
      issuer: base,
      authorization_endpoint: `${base}/oauth/authorize`,
      token_endpoint: `${base}/api/oauth/token`,
      registration_endpoint: `${base}/api/oauth/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: [MCP_SCOPE],
    },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" } },
  );
}

export const OPTIONS = metadataCorsOptionsRequestHandler();
