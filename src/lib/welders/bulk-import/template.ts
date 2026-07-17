import * as XLSX from "xlsx";
import {
  IMPORT_COLUMNS,
  IMPORT_SHEET_NAME,
  TEMPLATE_HEADER_LABELS,
  type ImportColumnKey,
} from "./columns";
import { parseImportWorkbook } from "./parse";
import { applyImportSheetFormats } from "./xlsx-formats";

export const TEMPLATE_EXAMPLE_ROW_COUNT = 2;

// Every row is independent — blank cells stay blank (no fill-forward).
// Repeat W# and name on each certificate row for the same welder.
//
// Sanjay — dual process (136+135) on a BW/FW test piece: FW columns become
// the supplementary fillet coverage on the BW qualification.
// Rajesh — single process (141), FW only, with multi-date continuity history
// in one cell (semicolon-separated).
const EXAMPLE_ROWS: Array<Partial<Record<ImportColumnKey, string | number>>> = [
  {
    welder_id: "W#14",
    full_name: "Sanjay Yadav",
    date_of_birth: "1988-05-20",
    id_method: "Aadhar",
    id_number: 123456789012,
    photo_filename: "W#14.jpg",
    process: "136+135",
    joint_type: "BW/FW",
    bw_position: "PF",
    fw_position: "PB",
    filler_group: "FM1",
    bw_test_thickness_mm: 12,
    fw_test_thickness_mm: 8,
    revalidation_method: "9.3b",
    weld_test_revalidation_date: "2025-08-19",
    validation_expiry_date: "2027-08-19",
    continuity_last_verified: "2026-01-15",
  },
  {
    welder_id: "W#15",
    full_name: "Rajesh Kumar",
    process: "141",
    joint_type: "FW",
    bw_position: "NA",
    fw_position: "PA",
    filler_group: "FM1",
    bw_test_thickness_mm: "NA",
    fw_test_thickness_mm: 12,
    revalidation_method: "9.3a",
    weld_test_revalidation_date: "2019-06-10",
    validation_expiry_date: "2026-03-01",
    continuity_last_verified:
      "2019-12-01;2020-06-01;2021-06-01;2023-06-01;2025-12-01",
  },
];

export function buildImportTemplateBuffer(): Buffer {
  const wb = XLSX.utils.book_new();

  const header = IMPORT_COLUMNS.map((col) => TEMPLATE_HEADER_LABELS[col]);
  const dataRows = EXAMPLE_ROWS.map((row) =>
    IMPORT_COLUMNS.map((col) => row[col] ?? ""),
  );

  const importSheet = XLSX.utils.aoa_to_sheet([header, ...dataRows]);
  applyImportSheetFormats(importSheet, header, dataRows.length);
  XLSX.utils.book_append_sheet(wb, importSheet, IMPORT_SHEET_NAME);

  return Buffer.from(
    XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer,
  );
}

/** Round-trip check: built template must parse without errors. */
export function verifyBuiltImportTemplate(): {
  ok: boolean;
  rowCount: number;
  fileError?: string;
  sheetNames?: string[];
} {
  const buffer = buildImportTemplateBuffer();
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;

  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const sheetNames = wb.SheetNames;

  const { rows, fileError } = parseImportWorkbook(arrayBuffer);
  const singleImportSheet =
    sheetNames.length === 1 && sheetNames[0] === IMPORT_SHEET_NAME;

  return {
    ok:
      !fileError &&
      rows.length === TEMPLATE_EXAMPLE_ROW_COUNT &&
      singleImportSheet,
    rowCount: rows.length,
    fileError,
    sheetNames,
  };
}
