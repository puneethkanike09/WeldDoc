import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3001"
  );
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

function mapUser(user: User, fallbackName?: string) {
  const metaName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : undefined;
  return {
    id: user.id,
    emailConfirmed: Boolean(user.email_confirmed_at),
    fullName:
      fallbackName?.trim() ||
      metaName?.trim() ||
      (user.email ? user.email.split("@")[0]! : "there"),
  };
}

/** Look up auth user via profiles.email then admin.getUserById. */
export async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .ilike("email", email)
    .maybeSingle();

  if (!profile?.id) return null;

  const { data, error } = await admin.auth.admin.getUserById(profile.id);
  if (error || !data.user) return null;

  return mapUser(
    data.user,
    typeof profile.full_name === "string" ? profile.full_name : undefined,
  );
}

export async function adminCreateUser(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<{ userId: string } | { error: string; code?: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: false,
    user_metadata: { full_name: input.fullName },
  });

  if (error) {
    return {
      error: error.message,
      code: error.code ?? undefined,
    };
  }
  if (!data.user) return { error: "User was not created." };
  return { userId: data.user.id };
}

/**
 * Magic-link style confirmation for an existing unverified user.
 * Does not send email — returns the action link for Resend.
 */
export async function adminGenerateVerificationLink(
  email: string,
): Promise<{ actionLink: string } | { error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${siteUrl()}/login?verified=1`,
    },
  });

  if (error) return { error: error.message };
  const actionLink = data.properties?.action_link;
  if (!actionLink) return { error: "No action link returned." };
  return { actionLink };
}

export async function adminGenerateRecoveryLink(
  email: string,
): Promise<{ actionLink: string } | { error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
    },
  });

  if (error) return { error: error.message };
  const actionLink = data.properties?.action_link;
  if (!actionLink) return { error: "No action link returned." };
  return { actionLink };
}

export async function adminEmailExists(email: string): Promise<boolean> {
  const user = await findAuthUserByEmail(email);
  return Boolean(user);
}
