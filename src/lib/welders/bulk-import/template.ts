import * as XLSX from "xlsx";
import {
  BW_POSITIONS,
  FILLER_GROUPS,
  ID_METHODS,
  JOINT_TYPES,
  MATERIAL_GROUPS,
  PRODUCT_TYPES,
  REVALIDATION_METHODS,
  TESTING_STANDARDS,
  WELDING_PROCESSES,
} from "@/lib/iso9606/constants";
import { IMPORT_COLUMNS, IMPORT_SHEET_NAME, MAX_IMPORT_ROWS } from "./columns";
import { parseImportWorkbook } from "./parse";

const INSTRUCTIONS = [
  ["WeldDoc — bulk welder import (ISO 9606-1 legacy migration)"],
  [],
  ["Your organisation (SaaS)"],
  ["• Each WeldDoc account has its own isolated welder registry — imports never affect other companies."],
  ["• Employer and branch/site are taken from your Settings — do not put them in this file."],
  ["• System UID and QR code are created automatically on import."],
  [],
  ["Plant welder ID (plant_welder_id)"],
  ["• Use this if you already have badge numbers (W#01, W#02, …). Formats accepted: W#01, W#1, or 1."],
  ["• Leave blank to auto-assign the next available ID in your organisation — preview shows assigned IDs before import."],
  ["• Must be unique within your organisation. Cannot reuse IDs already in WeldDoc."],
  [],
  ["Row rules"],
  ["• One row = one welder record OR one qualification for an existing welder in this file."],
  ["• Leave all qualification columns blank for welder-only rows (registry without prior WPQ)."],
  ["• Same plant_welder_id on multiple rows = one welder with multiple qualifications (welder details must match)."],
  ["• id_number must be unique per welder in your organisation."],
  [`• Maximum ${MAX_IMPORT_ROWS} data rows per file — split larger migrations into batches.`],
  ["• Dates: YYYY-MM-DD only (e.g. 2024-06-15)."],
  [],
  ["Welder columns"],
  ["Required: full_name, date_of_birth, place_of_birth, id_method, id_number"],
  ["Optional: plant_welder_id, email, welder_status (Active | Inactive | Suspended — default Active)"],
  [`id_method examples: ${ID_METHODS.join(" | ")} (or any custom label)`],
  ["place_of_birth: free text, e.g. City, State, Country"],
  [],
  ["Qualification columns (optional — for historical / legacy WPQ backfill)"],
  ["If any qualification column is filled, these are required:"],
  ["process, joint_type, position, base_material_group, test_thickness_mm, product, date_of_welding, revalidation_method"],
  ["Imported qualifications are marked legacy — add photos, signed PDFs, WPS, and examiner details on the welder profile later."],
  ["expiry_date: leave blank to auto-calculate from revalidation method."],
  ["result_vt / result_rt_ut / result_fracture: Pass | Fail | NA (defaults Pass, NA, NA)"],
  [],
  ["See the Reference sheet for allowed codes."],
];

function referenceRows(title: string, values: string[]): string[][] {
  return [[title], ...values.map((v) => [v]), []];
}

function buildReferenceSheet(): string[][] {
  const rows: string[][] = [["WeldDoc import — allowed values"], []];

  for (const block of [
    referenceRows(
      "process",
      WELDING_PROCESSES.map((p) => `${p.code} — ${p.label}`),
    ),
    referenceRows("joint_type", JOINT_TYPES.map((j) => j.code)),
    referenceRows("position (BW sample)", BW_POSITIONS.slice(0, 12)),
    referenceRows("position (FW sample)", ["PA", "PB", "PC", "PD", "PE", "PF"]),
    referenceRows("base_material_group", MATERIAL_GROUPS.map((m) => m.code)),
    referenceRows("filler_group", FILLER_GROUPS.map((f) => f.code)),
    referenceRows("product", [...PRODUCT_TYPES]),
    referenceRows("testing_standard", TESTING_STANDARDS.map((s) => s.code)),
    referenceRows("revalidation_method", REVALIDATION_METHODS.map((m) => m.code)),
    referenceRows("welder_status", ["Active", "Inactive", "Suspended"]),
    referenceRows("NDT results", ["Pass", "Fail", "NA"]),
  ]) {
    rows.push(...block);
  }

  return rows;
}

export const TEMPLATE_EXAMPLE_ROW_COUNT = 3;

const EXAMPLE_ROWS = [
  {
    plant_welder_id: "W#07",
    full_name: "Example — existing plant ID",
    email: "legacy@example.com",
    date_of_birth: "1990-01-15",
    place_of_birth: "City, State, Country",
    id_method: "Passport",
    id_number: "IMP-EX-001",
    welder_status: "Active",
  },
  {
    plant_welder_id: "",
    full_name: "Example — auto plant ID",
    email: "auto@example.com",
    date_of_birth: "1988-05-20",
    place_of_birth: "City, State, Country",
    id_method: "ID Card",
    id_number: "IMP-EX-002",
    welder_status: "Active",
    process: "135",
    joint_type: "BW",
    position: "PF",
    base_material_group: "1",
    filler_group: "FM1",
    test_thickness_mm: 12,
    deposited_thickness_mm: 8,
    product: "Plate",
    testing_standard: "EN ISO 9606-1:2017",
    date_of_welding: "2023-05-10",
    revalidation_method: "9.3b",
    result_vt: "Pass",
    result_rt_ut: "Pass",
    result_fracture: "NA",
  },
  {
    plant_welder_id: "W#07",
    full_name: "Example — existing plant ID",
    email: "legacy@example.com",
    date_of_birth: "1990-01-15",
    place_of_birth: "City, State, Country",
    id_method: "Passport",
    id_number: "IMP-EX-001",
    welder_status: "Active",
    process: "141",
    joint_type: "FW",
    position: "PA",
    base_material_group: "1",
    filler_group: "FM1",
    test_thickness_mm: 6,
    product: "Plate",
    testing_standard: "EN ISO 9606-1:2017",
    date_of_welding: "2022-11-03",
    revalidation_method: "9.3b",
    result_vt: "Pass",
    result_rt_ut: "NA",
    result_fracture: "NA",
  },
];

export function buildImportTemplateBuffer(): Buffer {
  const wb = XLSX.utils.book_new();

  const instructionsSheet = XLSX.utils.aoa_to_sheet(INSTRUCTIONS);
  XLSX.utils.book_append_sheet(wb, instructionsSheet, "Instructions");

  const referenceSheet = XLSX.utils.aoa_to_sheet(buildReferenceSheet());
  XLSX.utils.book_append_sheet(wb, referenceSheet, "Reference");

  const header = [...IMPORT_COLUMNS];
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
} {
  const buffer = buildImportTemplateBuffer();
  const { rows, fileError } = parseImportWorkbook(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  );
  return {
    ok: !fileError && rows.length === TEMPLATE_EXAMPLE_ROW_COUNT,
    rowCount: rows.length,
    fileError,
  };
}
