import { formatPlantWelderId } from "@/lib/welders/plant-id";
import type { ValidatedImportRow, WelderImportFields } from "./types";

function welderFingerprint(w: WelderImportFields): string {
  return [
    w.fullName,
    w.email ?? "",
    w.dateOfBirth,
    w.placeOfBirth,
    w.idMethod,
    w.idNumber,
    w.welderStatus,
  ].join("|");
}

function welderGroupKey(w: WelderImportFields): string {
  return w.plantWelderId || `__auto:${welderFingerprint(w)}`;
}

function maxNumericPlantId(taken: Set<string>, welderSeq: number): number {
  let maxNumeric = welderSeq;
  for (const id of taken) {
    const m = /^W#(\d+)$/i.exec(id);
    if (m) maxNumeric = Math.max(maxNumeric, parseInt(m[1], 10));
  }
  return maxNumeric;
}

/**
 * Assigns preview/commit plant IDs for rows with blank plant_welder_id.
 * Mutates rows in place; mirrors commit-time allocation order.
 */
export function assignImportPlantIds(
  rows: ValidatedImportRow[],
  existingPlantIds: Iterable<string>,
  welderSeq = 0,
): void {
  const taken = new Set(
    [...existingPlantIds]
      .map((id) => id.trim().toUpperCase())
      .filter(Boolean),
  );

  for (const row of rows) {
    if (row.welder.plantWelderId) {
      taken.add(row.welder.plantWelderId.toUpperCase());
    }
  }

  let maxNumeric = maxNumericPlantId(taken, welderSeq);
  const autoAssigned = new Map<string, string>();

  for (const row of rows) {
    if (row.welder.plantWelderId) continue;

    const key = welderGroupKey(row.welder);
    if (!autoAssigned.has(key)) {
      let candidate = maxNumeric + 1;
      while (taken.has(formatPlantWelderId(candidate).toUpperCase())) {
        candidate++;
      }
      const id = formatPlantWelderId(candidate);
      autoAssigned.set(key, id);
      taken.add(id.toUpperCase());
      maxNumeric = candidate;
    }

    row.welder.plantWelderId = autoAssigned.get(key)!;
  }
}
