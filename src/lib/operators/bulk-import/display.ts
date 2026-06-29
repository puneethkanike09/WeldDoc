import {
  OPERATOR_IMPORT_COLUMNS,
  type OperatorImportColumnKey,
} from "./columns";
import type { ValidatedOperatorImportRow } from "./types";

export function validatedRowToColumns(
  row: ValidatedOperatorImportRow,
): Record<OperatorImportColumnKey, string> {
  const o = row.operator;
  const q = row.qualification;

  const raw: Partial<Record<OperatorImportColumnKey, string | null>> = {
    plant_operator_id: o.plantOperatorId,
    full_name: o.fullName,
    email: o.email,
    date_of_birth: o.dateOfBirth,
    place_of_birth: o.placeOfBirth,
    id_method: o.idMethod,
    id_number: o.idNumber,
    operator_status: o.operatorStatus,
    welding_type: q?.weldingType ?? null,
    welding_mode: q?.weldingMode ?? null,
    process: q?.process ?? null,
    product_type: q?.productType ?? null,
    joint_type: q?.jointType ?? null,
    qualification_test_method: q?.qualificationTestMethod ?? null,
    method1_standard: q?.method1Standard ?? null,
    date_of_welding: q?.dateOfWelding ?? null,
    revalidation_method: q?.revalidationMethod ?? null,
    examiner_name: q?.examinerName ?? null,
    expiry_date: q?.expiryDate ?? null,
    continuity_last_verified: q?.continuityLastVerified ?? null,
    result_vt: q?.ndtResults.result_vt ?? null,
    result_mt_pt: q?.ndtResults.result_mt_pt ?? null,
    result_macro: q?.ndtResults.result_macro ?? null,
    result_bend_or_macro: q?.ndtResults.result_bend_or_macro ?? null,
    result_fracture_macro: q?.ndtResults.result_fracture_macro ?? null,
    result_rt_ut_bend: q?.ndtResults.result_rt_ut_bend ?? null,
    result_ut_bend: q?.ndtResults.result_ut_bend ?? null,
  };

  const out = {} as Record<OperatorImportColumnKey, string>;
  for (const col of OPERATOR_IMPORT_COLUMNS) {
    out[col] = raw[col] ?? "";
  }
  return out;
}

export function rowsToRawOperatorImport(
  rows: ValidatedOperatorImportRow[],
): Array<{ excelRow: number; raw: Record<string, string> }> {
  return rows.map((row) => ({
    excelRow: row.excelRow,
    raw: validatedRowToColumns(row),
  }));
}
