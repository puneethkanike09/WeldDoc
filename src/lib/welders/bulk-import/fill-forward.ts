import type { RawImportRow } from "./types";

const FILL_KEYS = [
  "plant_welder_id",
  "full_name",
  "date_of_birth",
  "id_method",
  "id_number",
  "photo_filename",
  "welder_status",
  "place_of_birth",
] as const;

/** Copy welder columns from the previous row when blank (same import file). */
export function fillForwardWelderFields(
  parsed: Array<{ excelRow: number; raw: RawImportRow }>,
): Array<{ excelRow: number; raw: RawImportRow }> {
  let last: Partial<RawImportRow> = {};
  return parsed.map(({ excelRow, raw }) => {
    const next = { ...raw };
    for (const key of FILL_KEYS) {
      const v = next[key];
      if (v == null || v === "") next[key] = last[key] ?? null;
      else last[key] = next[key];
    }
    return { excelRow, raw: next };
  });
}
