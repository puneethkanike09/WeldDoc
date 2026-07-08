export const OPERATOR_PROFILE_COLUMN_KEYS = [
  "plant_operator_id",
  "full_name",
  "date_of_birth",
  "place_of_birth",
  "id_method",
  "id_number",
  "operator_status",
] as const;

export const OPERATOR_QUAL_COLUMN_KEYS = [
  "welding_type",
  "welding_mode",
  "process",
  "product_type",
  "joint_type",
  "qualification_test_method",
  "method1_standard",
  "date_of_welding",
  "revalidation_method",
  "examiner_name",
  "expiry_date",
  "continuity_last_verified",
  "result_vt",
  "result_mt_pt",
  "result_macro",
  "result_bend_or_macro",
  "result_fracture_macro",
  "result_rt_ut_bend",
  "result_ut_bend",
] as const;

export const OPERATOR_IMPORT_COLUMNS = [
  ...OPERATOR_PROFILE_COLUMN_KEYS,
  ...OPERATOR_QUAL_COLUMN_KEYS,
] as const;

export type OperatorImportColumnKey = (typeof OPERATOR_IMPORT_COLUMNS)[number];

/**
 * Slim column set for the downloadable template and the read-only preview.
 * Personal-detail columns are still accepted if present but are not part of the
 * default template.
 */
export const OPERATOR_TEMPLATE_COLUMNS = [
  "plant_operator_id",
  "full_name",
  "welding_type",
  "welding_mode",
  "process",
  "product_type",
  "joint_type",
  "qualification_test_method",
  "method1_standard",
  "date_of_welding",
  "revalidation_method",
] as const satisfies readonly OperatorImportColumnKey[];

/** Columns that must be present/valid on every row. */
export const OPERATOR_REQUIRED_KEYS = [
  "plant_operator_id",
  "full_name",
] as const satisfies readonly OperatorImportColumnKey[];

export const OPERATOR_QUAL_REQUIRED_KEYS = [
  "welding_type",
  "welding_mode",
  "process",
  "product_type",
  "joint_type",
  "qualification_test_method",
  "date_of_welding",
  "revalidation_method",
] as const satisfies readonly OperatorImportColumnKey[];

/** Maps NDT test_method from requiredNdtTests to import column key. */
export const NDT_RESULT_COLUMN_BY_METHOD: Record<string, OperatorImportColumnKey> = {
  VT: "result_vt",
  "MT/PT": "result_mt_pt",
  Macro: "result_macro",
  "Bend or Macro": "result_bend_or_macro",
  "Fracture/Macro": "result_fracture_macro",
  "RT/UT/Bend": "result_rt_ut_bend",
  "UT/Bend": "result_ut_bend",
  "UT/Bend (RT not permitted)": "result_ut_bend",
  "RT/UT/Bend/Fracture/Notch Tensile": "result_rt_ut_bend",
  "UT/Bend/Fracture/Notch Tensile": "result_ut_bend",
  "UT/Bend/Fracture/Notch Tensile (RT not permitted)": "result_ut_bend",
};

export const MAX_OPERATOR_IMPORT_ROWS = 500;
export const OPERATOR_IMPORT_SHEET_NAME = "Import";
