"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface LoginFormProps {
  labels?: {
    password: string;
    placeholder: string;
    signingIn: string;
    signIn: string;
    errorRequired?: string;
    errorIncorrect?: string;
    errorTooManyAttempts?: string;
  };
  redirectTo?: string;
}

export default function LoginForm({ labels, redirectTo }: LoginFormProps) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const copy = labels ?? {
    password: "Password",
    placeholder: "Enter your password",
    signingIn: "Signing in...",
    signIn: "Sign in",
    errorRequired: "Password is required",
    errorIncorrect: "Incorrect password",
    errorTooManyAttempts: "Too many attempts. Try again later.",
  };

  const errorMessage =
    state?.error === "errorRequired"
      ? (copy.errorRequired ?? "Password is required")
      : state?.error === "errorIncorrect"
        ? (copy.errorIncorrect ?? "Incorrect password")
        : state?.error === "errorTooManyAttempts"
          ? (copy.errorTooManyAttempts ?? "Too many attempts. Try again later.")
          : state?.error;

  const hasError = Boolean(errorMessage);

  return (
    <form action={action} className="space-y-4">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <div className="space-y-2">
        <Label htmlFor="password">{copy.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={copy.placeholder}
          autoFocus
          disabled={pending}
          aria-invalid={hasError}
        />
      </div>
      <Button type="submit" className="w-full rounded-full" disabled={pending}>
        {pending ? copy.signingIn : copy.signIn}
      </Button>
      {/* Hidden while a retry is in flight, so each failure re-mounts the
          message and replays the shake — a physical "no" with the keyframes in
          globals.css; reduced motion just shows the text. */}
      {hasError && !pending && (
        <div
          role="alert"
          className="text-destructive flex animate-[login-shake_0.4s_ease-in-out] items-center justify-center gap-2 text-sm motion-reduce:animate-none"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </form>
  );
}
