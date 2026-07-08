import * as XLSX from "xlsx";
import {
  BW_POSITIONS,
  FILLER_GROUPS,
  JOINT_TYPES,
  MATERIAL_GROUPS,
  PRODUCT_TYPES,
  REVALIDATION_METHODS,
  TESTING_STANDARDS,
  WELDING_PROCESSES,
} from "@/lib/iso9606/constants";
import {
  IMPORT_SHEET_NAME,
  MAX_IMPORT_ROWS,
  TEMPLATE_COLUMNS,
} from "./columns";
import { parseImportWorkbook } from "./parse";

const INSTRUCTIONS = [
  ["WeldDoc — bulk welder import (ISO 9606-1 legacy migration)"],
  [],
  ["Your organisation (SaaS)"],
  ["• Each WeldDoc account has its own isolated welder registry — imports never affect other companies."],
  ["• Employer and branch/site are taken from your Settings — do not put them in this file."],
  ["• System UID and QR code are created automatically on import."],
  [],
  ["Only two columns are required: plant_welder_id (W# No) and full_name (welder name)."],
  ["Everything else is optional. WeldDoc computes the qualified ranges, positions,"],
  ["diameters, thicknesses and both expiry dates automatically — do not enter them here."],
  [],
  ["Plant welder ID (plant_welder_id / W# No)"],
  ["• Required. Formats accepted: W#01, W#1, or 1."],
  ["• If this W# already exists in WeldDoc, the qualification on the row is ATTACHED to that welder."],
  ["• If it is new, a new welder is created (personal details optional — add them on the profile later)."],
  [],
  ["Row rules"],
  ["• One row = one qualification. Repeat the same welder name and W# on every row for that welder."],
  ["• A welder with 3 qualifications = 3 rows, all with the same name and W#."],
  ["• Leave all qualification columns blank to just register a welder (no prior WPQ)."],
  [`• Maximum ${MAX_IMPORT_ROWS} data rows per file — split larger migrations into batches.`],
  ["• Dates are flexible: 2024-06-15, 15/06/2024, 15-06-2024 or 10 May 2023 all work (day-first)."],
  ["• Values are forgiving: paste codes or labels (process \"135\" or \"MAG (135)\" or \"SMAW\"), case does not matter, extra columns are ignored."],
  [],
  ["Qualification columns (fill these for a legacy WPQ)"],
  ["If any qualification column is filled, these are required:"],
  ["process, joint_type, position, base_material_group, test_thickness_mm, product, date_of_welding, revalidation_method"],
  ["• joint_type: BW (butt) or FW (fillet). A butt test also covers fillets automatically — no separate row needed unless you tested a fillet piece too."],
  ["• position: the actual test position (e.g. PF). WeldDoc computes the full qualified position range."],
  ["• filler_group: FM1–FM6 (the group used in the test)."],
  ["• pipe_od_mm: only for pipe/branch tests; leave blank for plate."],
  ["• Imported qualifications are marked legacy — add photos, signed PDFs, WPS and examiner details on the profile later."],
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
      WELDING_PROCESSES.map((p) => `${p.code} — ${p.name}`),
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

// One welder (W#02) with three qualifications — the same name and W# repeat on
// every row, matching how legacy sheets are laid out.
const EXAMPLE_ROWS = [
  {
    plant_welder_id: "W#02",
    full_name: "Sanjay Yadav",
    process: "136",
    joint_type: "BW",
    position: "PF",
    base_material_group: "1",
    filler_group: "FM1",
    test_thickness_mm: 12,
    product: "Plate",
    date_of_welding: "2025-08-19",
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
    revalidation_method: "9.3b",
  },
];

export function buildImportTemplateBuffer(): Buffer {
  const wb = XLSX.utils.book_new();

  const instructionsSheet = XLSX.utils.aoa_to_sheet(INSTRUCTIONS);
  XLSX.utils.book_append_sheet(wb, instructionsSheet, "Instructions");

  const referenceSheet = XLSX.utils.aoa_to_sheet(buildReferenceSheet());
  XLSX.utils.book_append_sheet(wb, referenceSheet, "Reference");

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
} {
  const buffer = buildImportTemplateBuffer();
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
  const { rows, fileError } = parseImportWorkbook(arrayBuffer);
  return {
    ok: !fileError && rows.length === TEMPLATE_EXAMPLE_ROW_COUNT,
    rowCount: rows.length,
    fileError,
  };
}
