import { IMPORT_COLUMNS, type ImportColumnKey } from "./columns";
import type { ValidatedImportRow } from "./types";

/**
 * Flat column map matching the Excel import sheet.
 *
 * Renders from the row's preserved (normalized) raw cells so the user always
 * sees exactly what they uploaded/edited — even when a field is invalid or a
 * qualification failed to parse. This is what keeps data from "disappearing"
 * in the preview grid.
 */
export function validatedRowToColumns(
  row: ValidatedImportRow,
): Record<ImportColumnKey, string> {
  const out = {} as Record<ImportColumnKey, string>;
  for (const col of IMPORT_COLUMNS) {
    if (col === "photo_filename") {
      out[col] = row.raw[col] ?? row.welder.photoFilename ?? "";
    } else {
      out[col] = row.raw[col] ?? "";
    }
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
