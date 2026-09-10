"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createAuthorizationCode } from "@/lib/oauth";
import { validateAuthorizeRequest } from "./validate";

function readParams(formData: FormData) {
  const get = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" && value ? value : undefined;
  };
  return {
    response_type: "code",
    client_id: get("client_id"),
    redirect_uri: get("redirect_uri"),
    state: get("state"),
    code_challenge: get("code_challenge"),
    code_challenge_method: "S256",
    scope: get("scope"),
  };
}

export async function approveAuthorizationAction(formData: FormData) {
  if (!(await getSession())) redirect("/login");

  const validated = await validateAuthorizeRequest(readParams(formData));
  if (validated.status === "invalid") redirect("/oauth/authorize");
  if (validated.status === "error_redirect") redirect(validated.url);

  const code = await createAuthorizationCode({
    clientId: validated.clientId,
    redirectUri: validated.redirectUri,
    codeChallenge: validated.codeChallenge,
    scope: validated.scope,
  });

  const url = new URL(validated.redirectUri);
  url.searchParams.set("code", code);
  if (validated.state) url.searchParams.set("state", validated.state);
  redirect(url.toString());
}

export async function denyAuthorizationAction(formData: FormData) {
  if (!(await getSession())) redirect("/login");

  const validated = await validateAuthorizeRequest(readParams(formData));
  if (validated.status === "invalid") redirect("/oauth/authorize");
  if (validated.status === "error_redirect") redirect(validated.url);

  const url = new URL(validated.redirectUri);
  url.searchParams.set("error", "access_denied");
  if (validated.state) url.searchParams.set("state", validated.state);
  redirect(url.toString());
}
