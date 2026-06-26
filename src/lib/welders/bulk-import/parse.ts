import * as XLSX from "xlsx";
import {
  IMPORT_COLUMNS,
  IMPORT_SHEET_NAME,
  MAX_IMPORT_ROWS,
} from "./columns";
import type { RawImportRow } from "./types";

function cellToString(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  const s = String(value).trim();
  return s.length ? s : null;
}

function isRowEmpty(row: RawImportRow): boolean {
  return Object.values(row).every((v) => v == null || v === "");
}

export function parseImportWorkbook(buffer: ArrayBuffer): {
  rows: Array<{ excelRow: number; raw: RawImportRow }>;
  fileError?: string;
} {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  } catch {
    return { rows: [], fileError: "Could not read the Excel file." };
  }

  const sheet =
    workbook.Sheets[IMPORT_SHEET_NAME] ??
    workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    return { rows: [], fileError: 'Missing "Import" worksheet.' };
  }

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

  const expected = new Set<string>(IMPORT_COLUMNS);
  const found = new Set(headerMap.values());
  const missing = IMPORT_COLUMNS.filter((c) => !found.has(c));
  if (missing.length > 0) {
    return {
      rows: [],
      fileError: `Missing column headers: ${missing.join(", ")}`,
    };
  }

  const extra = [...found].filter((h) => !expected.has(h));
  if (extra.length > 0) {
    return {
      rows: [],
      fileError: `Unknown column headers: ${extra.join(", ")}`,
    };
  }

  const parsed: Array<{ excelRow: number; raw: RawImportRow }> = [];

  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r] ?? [];
    const raw: RawImportRow = {};
    let hasValue = false;

    for (const [colIndex, key] of headerMap) {
      const val = cellToString(line[colIndex]);
      if (val != null) hasValue = true;
      raw[key] = val;
    }

    if (!hasValue || isRowEmpty(raw)) continue;

    parsed.push({ excelRow: r + 1, raw });
    if (parsed.length > MAX_IMPORT_ROWS) {
      return {
        rows: [],
        fileError: `Too many rows (max ${MAX_IMPORT_ROWS}). Split the file and import in batches.`,
      };
    }
  }

  if (parsed.length === 0) {
    return { rows: [], fileError: "No data rows found below the header." };
  }

  return { rows: parsed };
}
