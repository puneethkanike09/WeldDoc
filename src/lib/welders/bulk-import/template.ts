import * as XLSX from "xlsx";
import {
  IMPORT_SHEET_NAME,
  TEMPLATE_COLUMNS,
} from "./columns";
import { parseImportWorkbook } from "./parse";

export const TEMPLATE_EXAMPLE_ROW_COUNT = 4;

// One welder (W#02) with three qualifications — welder details repeat on row 1
// only; rows 2–3 leave personal columns blank (copied forward at validation).
const EXAMPLE_ROWS = [
  {
    plant_welder_id: "W#02",
    full_name: "Sanjay Yadav",
    date_of_birth: "1988-05-20",
    id_method: "Aadhar",
    id_number: "123456789012",
    photo_filename: "W#02.jpg",
    process: "136",
    joint_type: "BW",
    position: "PF",
    base_material_group: "1",
    filler_group: "FM1",
    test_thickness_mm: 12,
    product: "Plate",
    date_of_welding: "2025-08-19",
    expiry_date: "2027-08-19",
    continuity_last_verified: "2026-01-15",
    revalidation_method: "9.3b",
  },
  {
    plant_welder_id: "W#02",
    full_name: "Sanjay Yadav",
    process: "135",
    joint_type: "BW",
    position: "PF",
    base_material_group: "1",
    filler_group: "FM1",
    test_thickness_mm: 12,
    product: "Plate",
    date_of_welding: "2025-08-19",
    expiry_date: "2027-08-19",
    continuity_last_verified: "2026-01-15",
    revalidation_method: "9.3b",
  },
  {
    plant_welder_id: "W#02",
    full_name: "Sanjay Yadav",
    process: "121",
    joint_type: "FW",
    position: "PA",
    base_material_group: "1",
    filler_group: "FM1",
    test_thickness_mm: 15,
    product: "Plate",
    date_of_welding: "2026-02-25",
    expiry_date: "2028-02-25",
    continuity_last_verified: "2026-01-15",
    revalidation_method: "9.3b",
  },
  {
    plant_welder_id: "W#15",
    full_name: "Rajesh Kumar",
    process: "111",
    joint_type: "BW",
    position: "PA",
    base_material_group: "1",
    filler_group: "FM1",
    test_thickness_mm: 12,
    product: "Plate",
    date_of_welding: "2019-06-10",
    expiry_date: "2026-03-01",
    continuity_last_verified: "2025-12-01",
    continuity_history:
      "2019-12-01;2020-06-01;2021-06-01;2023-06-01;2025-12-01",
    revalidation_history: "2021-06-10;2023-06-10",
    revalidation_method: "9.3a",
  },
];

export function buildImportTemplateBuffer(): Buffer {
  const wb = XLSX.utils.book_new();

  const header = [...TEMPLATE_COLUMNS];
  const dataRows = EXAMPLE_ROWS.map((row) =>
    header.map((col) => {
      const v = row[col as keyof typeof row];
      return v ?? "";
    }),
  );

  const importSheet = XLSX.utils.aoa_to_sheet([header, ...dataRows]);
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
