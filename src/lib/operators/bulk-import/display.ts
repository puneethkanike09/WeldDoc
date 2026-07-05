import {
  OPERATOR_IMPORT_COLUMNS,
  type OperatorImportColumnKey,
} from "./columns";
import type { ValidatedOperatorImportRow } from "./types";

/**
 * Renders from the row's preserved (normalized) raw cells so the user always
 * sees exactly what they uploaded/edited — even when a field is invalid or a
 * qualification failed to parse.
 */
export function validatedRowToColumns(
  row: ValidatedOperatorImportRow,
): Record<OperatorImportColumnKey, string> {
  const out = {} as Record<OperatorImportColumnKey, string>;
  for (const col of OPERATOR_IMPORT_COLUMNS) {
    out[col] = row.raw[col] ?? "";
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
