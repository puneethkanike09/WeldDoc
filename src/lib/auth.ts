import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Organization, Profile } from "@/types/db";

export interface SessionContext {
  userId: string;
  email: string | null;
  profile: Profile;
  org: Organization;
}

/**
 * Loads the authenticated user's profile + organization.
 * Redirects to /login when there is no session.
 * Use in Server Components and Server Actions inside the (app) group.
 */
export async function requireSession(): Promise<SessionContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.org_id)
    .single();

  if (!org) redirect("/login");

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: profile as Profile,
    org: org as Organization,
  };
}
