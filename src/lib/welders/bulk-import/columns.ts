/** Excel import column keys — sheet "Import" row 1 headers. */
export const IMPORT_COLUMNS = [
  "plant_welder_id",
  "full_name",
  "email",
  "date_of_birth",
  "place_of_birth",
  "id_method",
  "id_number",
  "welder_status",
  "process",
  "joint_type",
  "position",
  "base_material_group",
  "filler_group",
  "test_thickness_mm",
  "deposited_thickness_mm",
  "pipe_od_mm",
  "product",
  "testing_standard",
  "date_of_welding",
  "expiry_date",
  "revalidation_method",
  "continuity_last_verified",
  "result_vt",
  "result_rt_ut",
  "result_fracture",
] as const;

export type ImportColumnKey = (typeof IMPORT_COLUMNS)[number];

export const WELDER_COLUMN_KEYS = [
  "plant_welder_id",
  "full_name",
  "email",
  "date_of_birth",
  "place_of_birth",
  "id_method",
  "id_number",
  "welder_status",
] as const satisfies readonly ImportColumnKey[];

export const QUAL_COLUMN_KEYS = [
  "process",
  "joint_type",
  "position",
  "base_material_group",
  "filler_group",
  "test_thickness_mm",
  "deposited_thickness_mm",
  "pipe_od_mm",
  "product",
  "testing_standard",
  "date_of_welding",
  "expiry_date",
  "revalidation_method",
  "continuity_last_verified",
  "result_vt",
  "result_rt_ut",
  "result_fracture",
] as const satisfies readonly ImportColumnKey[];

/** Required when any qualification column is filled. */
export const QUAL_REQUIRED_KEYS = [
  "process",
  "joint_type",
  "position",
  "base_material_group",
  "test_thickness_mm",
  "product",
  "date_of_welding",
  "revalidation_method",
] as const satisfies readonly ImportColumnKey[];

export const MAX_IMPORT_ROWS = 1000;

export const IMPORT_SHEET_NAME = "Import";
