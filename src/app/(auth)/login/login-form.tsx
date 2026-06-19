"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") || "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.replace(redirectTo);
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        router.replace(redirectTo);
        router.refresh();
      } else {
        setNotice(
          "Account created. Check your email to confirm, then sign in.",
        );
        setMode("signin");
        setLoading(false);
      }
    }
  }

  return (
    <div>
      <h1 className="font-display text-[28px] font-bold tracking-tight text-onyx">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-2 text-[15px] text-graphite">
        {mode === "signin"
          ? "Sign in to manage welder qualifications."
          : "Set up your welding engineer account to get started."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {mode === "signup" && (
          <Field label="Full name">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ram Kumar Korada"
              autoComplete="name"
              required
            />
          </Field>
        )}
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="engineer@plant.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            minLength={6}
            required
          />
        </Field>

        {error && (
          <p className="rounded-[10px] bg-expired/10 px-3 py-2 text-sm text-expired">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-[10px] bg-active/10 px-3 py-2 text-sm text-active-ink">
            {notice}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-graphite">
        {mode === "signin" ? "New to WeldDoc? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
          className="font-medium text-ember hover:underline"
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
