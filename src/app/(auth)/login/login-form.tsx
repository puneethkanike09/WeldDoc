"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import type { FieldErrors } from "@/lib/field-errors";
import {
  Loader2,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
} from "lucide-react";

const invalidBorder = "border-ember ring-1 ring-ember/20";

type Mode = "signin" | "signup" | "forgot";

type ApiResult = {
  success: boolean;
  message?: string;
  code?: string;
};

async function postAuth(path: string, body: Record<string, string>) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as ApiResult;
  return { ok: res.ok, data };
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") || "/dashboard";

  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    if (params.get("verified") === "1") {
      setNotice("Email verified. You can sign in now.");
      setMode("signin");
    }
    if (params.get("error") === "auth_callback") {
      toast.error("That auth link is invalid or expired. Request a new one.");
    }
  }, [params]);

  const clearError = (key: string) =>
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  async function handleResendVerification() {
    if (!email.trim()) {
      setFieldErrors({ email: "Email is required." });
      return;
    }
    setLoading(true);
    const { data } = await postAuth("/api/auth/resend-verification", {
      email: email.trim(),
    });
    if (data.success) {
      toast.success(data.message ?? "Verification email sent.");
      setNotice(data.message ?? "Check your email for a verification link.");
      setShowResend(false);
    } else {
      toast.error(data.message ?? "Could not resend verification email.");
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: FieldErrors = {};
    if (mode === "signup" && !fullName.trim()) {
      errors.full_name = "Full name is required.";
    }
    if (!email.trim()) errors.email = "Email is required.";
    if (mode !== "forgot" && !password) errors.password = "Password is required.";
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    setNotice(null);
    setShowResend(false);

    if (mode === "forgot") {
      const { data } = await postAuth("/api/auth/forgot-password", {
        email: email.trim(),
      });
      if (data.success) {
        setNotice(
          data.message ??
            "If an account exists for that email, a reset link has been sent.",
        );
        toast.success("Check your email for a reset link.");
        setMode("signin");
      } else {
        toast.error(data.message ?? "Could not send reset email.");
      }
      setLoading(false);
      return;
    }

    if (mode === "signin") {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        const unconfirmed =
          /confirm|verified|verification/i.test(error.message) ||
          error.message.toLowerCase().includes("email not confirmed");
        if (unconfirmed) {
          setShowResend(true);
          setNotice(
            "Your email is not verified yet. Resend the verification email below.",
          );
        }
        toast.error(error.message);
        setLoading(false);
        return;
      }
      router.replace(redirectTo);
      router.refresh();
      return;
    }

    const { data } = await postAuth("/api/auth/signup", {
      fullName: fullName.trim(),
      email: email.trim(),
      password,
    });

    if (!data.success) {
      toast.error(data.message ?? "Could not create account.");
      if (data.code === "EMAIL_ALREADY_EXISTS") {
        setFieldErrors({ email: "An account with this email already exists." });
      }
      setLoading(false);
      return;
    }

    setNotice(
      data.message ??
        "Account created. Check your email to confirm, then sign in.",
    );
    toast.success("Account created. Check your email to confirm.");
    setMode("signin");
    setPassword("");
    setLoading(false);
  }

  const title =
    mode === "signin"
      ? "Welcome back"
      : mode === "signup"
        ? "Create your account"
        : "Reset your password";

  const subtitle =
    mode === "signin"
      ? "Sign in to manage welder qualifications."
      : mode === "signup"
        ? "Set up your welding engineer account to get started."
        : "Enter your email and we will send a reset link.";

  return (
    <div>
      <h1 className="font-display text-[28px] font-bold tracking-tight text-onyx">
        {title}
      </h1>
      <p className="mt-2 text-[15px] text-graphite">{subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        {mode === "signup" && (
          <Field label="Full name" required error={fieldErrors.full_name}>
            <Input
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearError("full_name");
              }}
              placeholder="Alex Morgan"
              autoComplete="name"
              className={cn(fieldErrors.full_name && invalidBorder)}
            />
          </Field>
        )}
        <Field label="Email" required error={fieldErrors.email}>
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            placeholder="engineer@plant.com"
            autoComplete="email"
            className={cn(fieldErrors.email && invalidBorder)}
          />
        </Field>
        {mode !== "forgot" && (
          <Field label="Password" required error={fieldErrors.password}>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError("password");
                }}
                placeholder="••••••••"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                minLength={6}
                className={cn("pr-11", fieldErrors.password && invalidBorder)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-steel transition-colors hover:text-onyx"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </Field>
        )}

        {mode === "signin" && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setNotice(null);
                setFieldErrors({});
                setShowResend(false);
              }}
              className="text-sm font-medium text-ember hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}

        {notice && (
          <p className="rounded-[10px] bg-active/10 px-3 py-2 text-sm text-active-ink">
            {notice}
          </p>
        )}

        {showResend && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={loading}
            onClick={() => void handleResendVerification()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Resend verification email
          </Button>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "signin" ? (
            <LogIn className="h-4 w-4" />
          ) : mode === "signup" ? (
            <UserPlus className="h-4 w-4" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          {mode === "signin"
            ? "Sign in"
            : mode === "signup"
              ? "Create account"
              : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-graphite">
        {mode === "signin" ? (
          <>
            New to Weld.Doc?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setNotice(null);
                setFieldErrors({});
                setShowResend(false);
              }}
              className="font-medium text-ember hover:underline"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Remember your password?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setNotice(null);
                setFieldErrors({});
                setShowResend(false);
              }}
              className="font-medium text-ember hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
