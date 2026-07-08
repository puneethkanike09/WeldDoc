import type { SupabaseClient } from "@supabase/supabase-js";

const PLANT_ID_MIN_DIGITS = 2;

export function formatPlantOperatorId(num: number): string {
  if (!Number.isFinite(num) || num < 0) {
    throw new Error("Invalid plant operator number.");
  }
  return `O#${String(Math.trunc(num)).padStart(PLANT_ID_MIN_DIGITS, "0")}`;
}

export function normalizePlantOperatorId(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();

  if (/^O#/i.test(s)) {
    const rest = s.slice(2).trim().replace(/^#+/, "");
    if (!rest) return null;
    if (/^\d+$/.test(rest)) {
      const n = parseInt(rest, 10);
      return Number.isFinite(n) ? formatPlantOperatorId(n) : null;
    }
    return `O#${rest}`;
  }

  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? formatPlantOperatorId(n) : null;
  }

  return s;
}

export function suggestPlantOperatorId(currentOperatorSeq: number): string {
  return formatPlantOperatorId(currentOperatorSeq + 1);
}

function collectTakenPlantOperatorIds(
  rows: { operator_id: string | null }[],
): { taken: Set<string>; maxNumeric: number } {
  const taken = new Set<string>();
  let maxNumeric = 0;
  for (const row of rows) {
    const normalized = normalizePlantOperatorId(row.operator_id);
    if (!normalized) continue;
    taken.add(normalized.toUpperCase());
    const m = /^O#(\d+)$/i.exec(normalized);
    if (m) maxNumeric = Math.max(maxNumeric, parseInt(m[1], 10));
  }
  return { taken, maxNumeric };
}

export async function nextAvailablePlantOperatorId(
  supabase: SupabaseClient,
  orgId: string,
  operatorSeq: number,
): Promise<string> {
  const { data, error } = await supabase
    .from("operators")
    .select("operator_id")
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);

  const { taken, maxNumeric } = collectTakenPlantOperatorIds(data ?? []);
  let candidate = Math.max(operatorSeq, maxNumeric) + 1;
  while (taken.has(formatPlantOperatorId(candidate).toUpperCase())) {
    candidate++;
  }
  return formatPlantOperatorId(candidate);
}

/** Next unused plant ID given existing IDs (registry + in-form rows). */
export function nextPlantOperatorIdSkipping(
  taken: Iterable<string>,
  startFrom: string,
): string {
  const takenSet = new Set<string>();
  for (const raw of taken) {
    const normalized = normalizePlantOperatorId(raw);
    if (normalized) takenSet.add(normalized.toUpperCase());
  }
  const seed = normalizePlantOperatorId(startFrom);
  const seedMatch = seed ? /^O#(\d+)$/i.exec(seed) : null;
  let candidate = seedMatch ? parseInt(seedMatch[1], 10) : 1;
  while (takenSet.has(formatPlantOperatorId(candidate).toUpperCase())) {
    candidate++;
  }
  return formatPlantOperatorId(candidate);
}

export async function assertPlantOperatorIdAvailable(
  supabase: SupabaseClient,
  orgId: string,
  plantOperatorId: string,
  excludeOperatorId?: string,
): Promise<void> {
  const normalized = normalizePlantOperatorId(plantOperatorId);
  if (!normalized) throw new Error("Plant operator ID is required.");

  let q = supabase
    .from("operators")
    .select("id, full_name")
    .eq("org_id", orgId)
    .ilike("operator_id", normalized);

  if (excludeOperatorId) q = q.neq("id", excludeOperatorId);

  const { data, error } = await q.limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (data) {
    throw new Error(
      `Plant operator ID "${normalized}" is already assigned to ${data.full_name}.`,
    );
  }
}

export function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}
