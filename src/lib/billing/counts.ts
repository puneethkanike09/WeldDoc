import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Exact head-count helpers for plan-limit enforcement. Use `count: exact` with
 * `head: true` so Postgres returns only the count (no rows transferred).
 */

export async function countOrgWelders(
  supabase: SupabaseClient,
  orgId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("welders")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function countOrgOperators(
  supabase: SupabaseClient,
  orgId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("operators")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
