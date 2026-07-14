import type { RawImportRow } from "./types";

/**
 * Production rule: never copy a previous row into a blank cell.
 * Blank in Excel = blank in WeldDoc. Multi-certificate welders must
 * repeat W# and full_name on every row.
 */
export function fillForwardWelderFields(
  parsed: Array<{ excelRow: number; raw: RawImportRow }>,
): Array<{ excelRow: number; raw: RawImportRow }> {
  return parsed.map(({ excelRow, raw }) => ({
    excelRow,
    raw: { ...raw },
  }));
}
