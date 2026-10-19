"use client";

import { useActionState, useEffect, useRef } from "react";
import { loginAction } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  labels?: {
    passwordLabel: string;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const copy = labels ?? {
    passwordLabel: "Password",
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

  const showError = Boolean(errorMessage) && !pending;

  // Every failed attempt returns a new state object, so the field is ready
  // for the next try without clicking back into it.
  useEffect(() => {
    if (!state?.error) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [state]);

  return (
    <form action={action} className="space-y-4">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <div className="space-y-2">
        <Label htmlFor="password">{copy.passwordLabel}</Label>
        {/* The class drops while a retry is in flight, so each failure replays
            the shake — a physical "no" with the keyframes in globals.css;
            reduced motion just shows the message. */}
        <div
          className={cn(
            showError && "animate-[login-shake_0.4s_ease-in-out] motion-reduce:animate-none",
          )}
        >
          <Input
            ref={inputRef}
            id="password"
            name="password"
            type="password"
            placeholder={copy.placeholder}
            autoFocus
            readOnly={pending}
            aria-invalid={showError}
            aria-describedby={showError ? "password-error" : undefined}
            className="max-md:h-10"
          />
        </div>
        {showError && (
          <p
            id="password-error"
            role="alert"
            className="text-destructive flex items-center gap-1.5 text-sm"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>
      <Button type="submit" className="w-full rounded-full max-md:h-10" disabled={pending}>
        {pending ? copy.signingIn : copy.signIn}
      </Button>
    </form>
  );
}
