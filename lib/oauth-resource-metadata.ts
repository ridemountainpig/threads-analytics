import { generateProtectedResourceMetadata, getPublicOrigin } from "mcp-handler";
import { MCP_SCOPE } from "@/lib/oauth";

export function protectedResourceMetadataResponse(request: Request) {
  const base = getPublicOrigin(request);
  return Response.json(
    generateProtectedResourceMetadata({
      authServerUrls: [base],
      resourceUrl: `${base}/api/mcp`,
      additionalMetadata: { scopes_supported: [MCP_SCOPE] },
    }),
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" } },
  );
}
