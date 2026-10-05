import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { MCP_SCOPE, verifyAccessToken } from "@/lib/oauth";
import { registerMcpServer } from "@/lib/mcp-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createMcpHandler(registerMcpServer, {
  serverInfo: { name: "threads-analytics", version: "1.0.0" },
  instructions:
    "Read-only analytics for the owner's Threads accounts. Call get_account_overview first to see what data is available; when more than one account is connected, ask the user which one they mean and pass it as 'account' to every other tool. Then use list_posts / get_post for raw posts and get_analytics for aggregates; to compare posts at the same age since publishing, or tell whether a new post is ahead of the usual pace, use compare_post_growth; for a review of one calendar month, use get_monthly_review.",
});

const authHandler = withMcpAuth(
  handler,
  async (_req, bearerToken) => {
    if (!bearerToken) return undefined;
    const verified = await verifyAccessToken(bearerToken);
    if (!verified) return undefined;
    return {
      token: bearerToken,
      clientId: verified.clientId,
      scopes: verified.scopes,
      expiresAt: verified.expiresAt,
    };
  },
  {
    required: true,
    requiredScopes: [MCP_SCOPE],
    resourceMetadataPath: "/.well-known/oauth-protected-resource",
  },
);

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
