import * as XLSX from "xlsx";
import {
  OPERATOR_IMPORT_COLUMNS,
  OPERATOR_IMPORT_SHEET_NAME,
  MAX_OPERATOR_IMPORT_ROWS,
} from "./columns";
import type { RawOperatorImportRow } from "./types";

function cellToString(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  const s = String(value).trim();
  return s.length ? s : null;
}

export function parseOperatorImportWorkbook(buffer: ArrayBuffer): {
  rows: Array<{ excelRow: number; raw: RawOperatorImportRow }>;
  fileError?: string;
} {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  } catch {
    return { rows: [], fileError: "Could not read the Excel file." };
  }

  const sheet =
    workbook.Sheets[OPERATOR_IMPORT_SHEET_NAME] ??
    workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { rows: [], fileError: 'Missing "Import" worksheet.' };

  const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });
  if (matrix.length < 2) {
    return { rows: [], fileError: "The Import sheet has no data rows." };
  }

  const headerRow = matrix[0] ?? [];
  const headerMap = new Map<number, string>();
  for (let i = 0; i < headerRow.length; i++) {
    const key = cellToString(headerRow[i]);
    if (key) headerMap.set(i, key);
  }

  const expected = new Set<string>(OPERATOR_IMPORT_COLUMNS);
  const found = new Set(headerMap.values());
  const missingCols = OPERATOR_IMPORT_COLUMNS.filter((c) => !found.has(c));
  if (missingCols.length > 0) {
    return { rows: [], fileError: `Missing column headers: ${missingCols.join(", ")}` };
  }

  const parsed: Array<{ excelRow: number; raw: RawOperatorImportRow }> = [];
  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r] ?? [];
    const raw: RawOperatorImportRow = {};
    let hasValue = false;
    for (const [colIndex, key] of headerMap) {
      const val = cellToString(line[colIndex]);
      if (val != null) hasValue = true;
      raw[key] = val;
    }
    if (!hasValue) continue;
    parsed.push({ excelRow: r + 1, raw });
    if (parsed.length > MAX_OPERATOR_IMPORT_ROWS) {
      return {
        rows: [],
        fileError: `Too many rows (max ${MAX_OPERATOR_IMPORT_ROWS}).`,
      };
    }
  }

  if (parsed.length === 0) {
    return { rows: [], fileError: "No data rows found." };
  }
  return { rows: parsed };
}
