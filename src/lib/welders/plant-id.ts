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

/** Preview the next plant ID before save (sequence only — may already be taken). */
export function suggestPlantWelderId(currentWelderSeq: number): string {
  return formatPlantWelderId(currentWelderSeq + 1);
}

function collectTakenPlantWelderIds(
  rows: { welder_id: string | null }[],
): { taken: Set<string>; maxNumeric: number } {
  const taken = new Set<string>();
  let maxNumeric = 0;
  for (const row of rows) {
    const normalized = normalizePlantWelderId(row.welder_id);
    if (!normalized) continue;
    taken.add(normalized.toUpperCase());
    const m = /^W#(\d+)$/i.exec(normalized);
    if (m) maxNumeric = Math.max(maxNumeric, parseInt(m[1], 10));
  }
  return { taken, maxNumeric };
}

/** First unused W# ID — skips IDs already assigned (e.g. after Excel import). */
export async function nextAvailablePlantWelderId(
  supabase: SupabaseClient,
  orgId: string,
  welderSeq: number,
): Promise<string> {
  const { data, error } = await supabase
    .from("welders")
    .select("welder_id")
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);

  const { taken, maxNumeric } = collectTakenPlantWelderIds(data ?? []);
  let candidate = Math.max(welderSeq, maxNumeric) + 1;
  while (taken.has(formatPlantWelderId(candidate).toUpperCase())) {
    candidate++;
  }
  return formatPlantWelderId(candidate);
}

/** Next unused plant ID given existing IDs (registry + in-form rows). */
export function nextPlantWelderIdSkipping(
  taken: Iterable<string>,
  startFrom: string,
): string {
  const takenSet = new Set<string>();
  for (const raw of taken) {
    const normalized = normalizePlantWelderId(raw);
    if (normalized) takenSet.add(normalized.toUpperCase());
  }
  const seed = normalizePlantWelderId(startFrom);
  const seedMatch = seed ? /^W#(\d+)$/i.exec(seed) : null;
  let candidate = seedMatch ? parseInt(seedMatch[1], 10) : 1;
  while (takenSet.has(formatPlantWelderId(candidate).toUpperCase())) {
    candidate++;
  }
  return formatPlantWelderId(candidate);
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
