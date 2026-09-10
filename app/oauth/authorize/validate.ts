import "server-only";

import { MCP_SCOPE, getClient } from "@/lib/oauth";

export interface AuthorizeParams {
  response_type?: string;
  client_id?: string;
  redirect_uri?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  scope?: string;
}

export type AuthorizeValidation =
  | { status: "invalid" }
  | { status: "error_redirect"; url: string }
  | {
      status: "ok";
      clientId: string;
      clientName: string;
      redirectUri: string;
      state: string | null;
      codeChallenge: string;
      scope: string;
    };

export async function validateAuthorizeRequest(
  params: AuthorizeParams,
): Promise<AuthorizeValidation> {
  const clientId = params.client_id;
  const redirectUri = params.redirect_uri;
  if (!clientId || !redirectUri) return { status: "invalid" };

  const client = await getClient(clientId);
  if (!client || !client.redirectUris.includes(redirectUri)) return { status: "invalid" };

  const errorRedirect = (error: string): AuthorizeValidation => {
    const url = new URL(redirectUri);
    url.searchParams.set("error", error);
    if (params.state) url.searchParams.set("state", params.state);
    return { status: "error_redirect", url: url.toString() };
  };

  if (params.response_type !== "code") return errorRedirect("unsupported_response_type");
  if (!params.code_challenge || params.code_challenge_method !== "S256") {
    return errorRedirect("invalid_request");
  }
  if (params.scope && params.scope.split(" ").some((s) => s && s !== MCP_SCOPE)) {
    return errorRedirect("invalid_scope");
  }

  return {
    status: "ok",
    clientId,
    clientName: client.name,
    redirectUri,
    state: params.state ?? null,
    codeChallenge: params.code_challenge,
    scope: MCP_SCOPE,
  };
}
