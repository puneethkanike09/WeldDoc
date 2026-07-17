/**
 * Excel import column keys — client template headers (Import sheet row 1).
 * Canonical keys are lowercase snake_case after header normalization.
 */
export const IMPORT_COLUMNS = [
  "welder_id",
  "full_name",
  "date_of_birth",
  "id_method",
  "id_number",
  "photo_filename",
  "process",
  "joint_type",
  "bw_position",
  "fw_position",
  "filler_group",
  "bw_test_thickness_mm",
  "fw_test_thickness_mm",
  "pipe_od_mm",
  "revalidation_method",
  "weld_test_revalidation_date",
  "validation_expiry_date",
  "continuity_last_verified",
] as const;

export type ImportColumnKey = (typeof IMPORT_COLUMNS)[number];

/** Extra header spellings → canonical key. */
export const HEADER_ALIASES: Record<string, ImportColumnKey> = {
  plant_welder_id: "welder_id",
  "welder_id": "welder_id",
  "bw_position": "bw_position",
  "fw_position": "fw_position",
  "bw_test_thickness_mm": "bw_test_thickness_mm",
  "fw_test_thickness_mm": "fw_test_thickness_mm",
  weld_test_re_validation_date: "weld_test_revalidation_date",
  date_of_welding: "weld_test_revalidation_date",
  expiry_date: "validation_expiry_date",
  validation_expiry_date: "validation_expiry_date",
  continuity_history: "continuity_last_verified",
};

export const WELDER_COLUMN_KEYS = [
  "welder_id",
  "full_name",
  "date_of_birth",
  "id_method",
  "id_number",
  "photo_filename",
] as const satisfies readonly ImportColumnKey[];

export const TEMPLATE_COLUMNS = [...IMPORT_COLUMNS] as const;

export const WELDER_REQUIRED_KEYS = [
  "full_name",
] as const satisfies readonly ImportColumnKey[];

/** Required when any qualification column is filled. */
export const QUAL_REQUIRED_KEYS = [
  "process",
  "joint_type",
  "weld_test_revalidation_date",
  "revalidation_method",
] as const satisfies readonly ImportColumnKey[];

export const MAX_IMPORT_ROWS = 1000;

export const IMPORT_SHEET_NAME = "Import";

/** Exact download headers matching the client file. */
export const TEMPLATE_HEADER_LABELS: Record<ImportColumnKey, string> = {
  welder_id: "welder_id",
  full_name: "full_name",
  date_of_birth: "date_of_birth",
  id_method: "id_method",
  id_number: "id_number",
  photo_filename: "photo_filename",
  process: "process",
  joint_type: "joint_type",
  bw_position: "BW position",
  fw_position: "FW position",
  filler_group: "filler_group",
  bw_test_thickness_mm: "BW test_thickness_mm",
  fw_test_thickness_mm: "FW test_thickness_mm",
  pipe_od_mm: "pipe_od_mm",
  revalidation_method: "revalidation_method",
  weld_test_revalidation_date: "Weld Test/ Re validation Date",
  validation_expiry_date: "Validation expiry_date",
  continuity_last_verified: "continuity_last_verified",
};
