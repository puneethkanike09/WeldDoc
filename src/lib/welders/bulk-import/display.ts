import { IMPORT_COLUMNS, type ImportColumnKey } from "./columns";
import type { ValidatedImportRow } from "./types";

/** Flat column map matching the Excel import sheet. */
export function validatedRowToColumns(
  row: ValidatedImportRow,
): Record<ImportColumnKey, string> {
  const w = row.welder;
  const q = row.qualification;

  const raw: Record<ImportColumnKey, string | null> = {
    plant_welder_id: w.plantWelderId,
    full_name: w.fullName,
    email: w.email,
    date_of_birth: w.dateOfBirth,
    place_of_birth: w.placeOfBirth,
    id_method: w.idMethod,
    id_number: w.idNumber,
    welder_status: w.welderStatus,
    process: q?.process ?? null,
    joint_type: q?.jointType ?? null,
    position: q?.position ?? null,
    base_material_group: q?.baseMaterialGroup ?? null,
    filler_group: q?.fillerGroup ?? null,
    test_thickness_mm: q ? String(q.testThicknessMm) : null,
    deposited_thickness_mm:
      q?.depositedThicknessMm != null ? String(q.depositedThicknessMm) : null,
    pipe_od_mm: q?.pipeOdMm != null ? String(q.pipeOdMm) : null,
    product: q?.product ?? null,
    testing_standard: q?.testingStandard ?? null,
    date_of_welding: q?.dateOfWelding ?? null,
    expiry_date: q?.expiryDate ?? null,
    revalidation_method: q?.revalidationMethod ?? null,
    continuity_last_verified: q?.continuityLastVerified ?? null,
    result_vt: q?.resultVt ?? null,
    result_rt_ut: q?.resultRtUt ?? null,
    result_fracture: q?.resultFracture ?? null,
  };

  const out = {} as Record<ImportColumnKey, string>;
  for (const col of IMPORT_COLUMNS) {
    out[col] = raw[col] ?? "";
  }
  return out;
}

export function rowsToRawImport(
  rows: ValidatedImportRow[],
): Array<{ excelRow: number; raw: Record<string, string> }> {
  return rows.map((row) => ({
    excelRow: row.excelRow,
    raw: validatedRowToColumns(row),
  }));
}
