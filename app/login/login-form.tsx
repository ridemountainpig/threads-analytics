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
  };

  const errorMessage =
    state?.error === "errorRequired"
      ? (copy.errorRequired ?? "Password is required")
      : state?.error === "errorIncorrect"
        ? (copy.errorIncorrect ?? "Incorrect password")
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
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? copy.signingIn : copy.signIn}
      </Button>
      {hasError && (
        <div className="text-destructive flex items-center justify-center gap-2 text-sm">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </form>
  );
}
