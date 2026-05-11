"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { verifyPassword, createSession, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { clearLoginAttempts, consumeLoginAttempt, getClientIp } from "@/lib/login-rate-limit";

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const password = formData.get("password") as string;
  if (!password) return { error: "errorRequired" };

  const ip = getClientIp(await headers());
  if (!consumeLoginAttempt(ip)) return { error: "errorTooManyAttempts" };

  const valid = await verifyPassword(password);
  if (!valid) return { error: "errorIncorrect" };

  clearLoginAttempts(ip);
  const token = await createSession();
  await setSessionCookie(token);
  const redirectTo = formData.get("redirectTo") as string | null;
  const destination =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard/overview";
  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
