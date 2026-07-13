"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const invalidBorder = "border-ember ring-1 ring-ember/20";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      toast.error(updateError.message);
      setLoading(false);
      return;
    }

    toast.success("Password updated. You can sign in now.");
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-display text-[28px] font-bold tracking-tight text-onyx">
        Set a new password
      </h1>
      <p className="mt-2 text-[15px] text-graphite">
        Choose a new password for your Weld.Doc account.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        <Field label="New password" required error={error ?? undefined}>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              autoComplete="new-password"
              minLength={6}
              className={cn("pr-11", error && invalidBorder)}
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
        <Field label="Confirm password" required>
          <Input
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setError(null);
            }}
            autoComplete="new-password"
            minLength={6}
            className={cn(error && invalidBorder)}
          />
        </Field>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          Update password
        </Button>
      </form>
    </div>
  );
}
