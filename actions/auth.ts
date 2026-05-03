"use server";

import { redirect } from "next/navigation";
import { verifyPassword, createSession, setSessionCookie, clearSessionCookie } from "@/lib/auth";

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const password = formData.get("password") as string;
  if (!password) return { error: "errorRequired" };

  const valid = await verifyPassword(password);
  if (!valid) return { error: "errorIncorrect" };

  const token = await createSession();
  await setSessionCookie(token);
  redirect("/dashboard/overview");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
