import type { SupabaseClient } from "@supabase/supabase-js";

/** Minimum digit width for the numeric part (W#01 … W#09, W#10, …). */
const PLANT_ID_MIN_DIGITS = 2;

/** Format numeric plant ID: 2 → W#02, 10 → W#10, 247 → W#247. */
export function formatPlantWelderId(num: number): string {
  if (!Number.isFinite(num) || num < 0) {
    throw new Error("Invalid plant welder number.");
  }
  return `W#${String(Math.trunc(num)).padStart(PLANT_ID_MIN_DIGITS, "0")}`;
}

/** Normalise user input to W#01-style plant ID (e.g. 2 → W#02, W#2 → W#02). */
export function normalizePlantWelderId(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();

  if (/^W#/i.test(s)) {
    const rest = s.slice(2).trim().replace(/^#+/, "");
    if (!rest) return null;
    if (/^\d+$/.test(rest)) {
      const n = parseInt(rest, 10);
      return Number.isFinite(n) ? formatPlantWelderId(n) : null;
    }
    return `W#${rest}`;
  }

  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? formatPlantWelderId(n) : null;
  }

  return s;
}

/** Derive plant ID from system UID (PUNI-2026-002 → W#02). */
export function plantWelderIdFromUid(uid: string): string | null {
  const m = uid.match(/-(\d+)$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? formatPlantWelderId(n) : null;
}

/** Preview the next plant ID before save (matches welder sequence). */
export function suggestPlantWelderId(currentWelderSeq: number): string {
  return formatPlantWelderId(currentWelderSeq + 1);
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
