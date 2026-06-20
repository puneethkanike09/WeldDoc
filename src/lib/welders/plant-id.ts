import type { SupabaseClient } from "@supabase/supabase-js";

/** Normalise user input to the plant ID format (e.g. 247 → W#247). */
export function normalizePlantWelderId(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  if (/^W#/i.test(s)) {
    const rest = s.slice(2).trim().replace(/^#+/, "");
    return rest ? `W#${rest}` : null;
  }
  if (/^\d+$/.test(s)) return `W#${s}`;
  return s;
}

/** Derive W#nnn from the system UID (WLD-2026-047 → W#47). */
export function plantWelderIdFromUid(uid: string): string | null {
  const m = uid.match(/-(\d+)$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? `W#${n}` : null;
}

/** Preview the next plant ID before save (matches the next UID sequence). */
export function suggestPlantWelderId(currentWelderSeq: number): string {
  return `W#${currentWelderSeq + 1}`;
}

export async function assertPlantWelderIdAvailable(
  supabase: SupabaseClient,
  orgId: string,
  plantWelderId: string,
  excludeWelderId?: string,
): Promise<void> {
  const normalized = normalizePlantWelderId(plantWelderId);
  if (!normalized) throw new Error("Plant welder ID is required.");

  let q = supabase
    .from("welders")
    .select("id, full_name")
    .eq("org_id", orgId)
    .ilike("welder_id", normalized);

  if (excludeWelderId) q = q.neq("id", excludeWelderId);

  const { data, error } = await q.limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (data) {
    throw new Error(
      `Plant welder ID "${normalized}" is already assigned to ${data.full_name}. Choose a different ID.`,
    );
  }
}

export function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}
