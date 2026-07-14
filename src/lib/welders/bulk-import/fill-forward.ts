import type { RawImportRow } from "./types";

const FILL_KEYS = [
  "plant_welder_id",
  "full_name",
  "date_of_birth",
  "id_method",
  "id_number",
  "welder_status",
  "place_of_birth",
] as const;

function cellEmpty(raw: RawImportRow, key: (typeof FILL_KEYS)[number]): boolean {
  const v = raw[key];
  return v == null || v === "";
}

/**
 * Qualification-only row: welder name and W# both blank → same person as row above.
 * Any explicit W# or name starts a new welder row; other blank cells stay blank.
 */
export function isWelderContinuationRow(raw: RawImportRow): boolean {
  return cellEmpty(raw, "plant_welder_id") && cellEmpty(raw, "full_name");
}

/** Copy welder columns from the previous row only on qualification continuation rows.
 *  Qualification columns (process, position, dates, etc.) are never fill-forwarded. */
export function fillForwardWelderFields(
  parsed: Array<{ excelRow: number; raw: RawImportRow }>,
): Array<{ excelRow: number; raw: RawImportRow }> {
  let last: Partial<RawImportRow> = {};
  return parsed.map(({ excelRow, raw }) => {
    const next = { ...raw };

    if (isWelderContinuationRow(raw)) {
      for (const key of FILL_KEYS) {
        const v = next[key];
        if (cellEmpty(next, key)) next[key] = last[key] ?? null;
        else last[key] = next[key];
      }
    } else {
      last = {};
      for (const key of FILL_KEYS) {
        const v = next[key];
        if (!cellEmpty(next, key)) last[key] = next[key];
      }
    }

    return { excelRow, raw: next };
  });
}
