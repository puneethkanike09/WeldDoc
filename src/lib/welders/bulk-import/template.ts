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
import { IMPORT_COLUMNS, IMPORT_SHEET_NAME } from "./columns";

const INSTRUCTIONS = [
  ["WeldDoc — bulk welder import template"],
  [],
  ["Rules"],
  ["• Dates must be YYYY-MM-DD (e.g. 2024-06-15)."],
  ["• One row = one record. Leave qualification columns blank for welder-only rows."],
  ["• Multiple rows with the same plant_welder_id are allowed if welder details match (multiple qualifications)."],
  ["• plant_welder_id uses W#01 format (same as Add welder). Leave blank to auto-assign from your welder sequence on import."],
  ["• Employer and branch/site are taken from your organisation settings — not imported from Excel."],
  ["• Photos and PDF certificates are not imported — add them on the welder profile after import."],
  ["• Maximum 500 data rows per file."],
  [],
  ["Welder columns (required unless noted)"],
  ["plant_welder_id — optional (W#01 …); full_name; email — optional; date_of_birth; place_of_birth; id_method; id_number"],
  ["welder_status — optional, default Active (Active | Inactive | Suspended)"],
  [`id_method — e.g. ${ID_METHODS.join(" | ")} or any custom label`],
  [],
  ["Qualification columns (optional block — if any is filled, required fields must be completed)"],
  ["Required when importing qualifications: process, joint_type, position, base_material_group, test_thickness_mm, product, date_of_welding, revalidation_method"],
  [`process — e.g. ${WELDING_PROCESSES.map((p) => p.code).join(", ")}`],
  [`joint_type — ${JOINT_TYPES.map((j) => j.code).join(" | ")}`],
  [`position — e.g. ${BW_POSITIONS.slice(0, 6).join(", ")}…`],
  [`base_material_group — ${MATERIAL_GROUPS.map((m) => m.code).join(", ")}`],
  [`filler_group — ${FILLER_GROUPS.map((f) => f.code).join(", ")} (default FM1)`],
  [`product — ${PRODUCT_TYPES.join(" | ")}`],
  [`testing_standard — ${TESTING_STANDARDS.map((s) => s.code).join(" | ")} (default EN ISO 9606-1:2017)`],
  ["revalidation_method — 9.3a | 9.3b | 9.3c"],
  ["result_vt / result_rt_ut / result_fracture — Pass | Fail | NA (defaults: Pass, NA, NA)"],
  ["expiry_date — leave blank to auto-calculate from revalidation method"],
];

const EXAMPLE_ROWS = [
  {
    plant_welder_id: "W#01",
    full_name: "Example Welder (welder only)",
    email: "welder@example.com",
    date_of_birth: "1990-01-15",
    place_of_birth: "City, State, Country",
    id_method: "Passport",
    id_number: "AB123456",
    welder_status: "Active",
  },
  {
    plant_welder_id: "W#02",
    full_name: "Example Welder (with qualification)",
    email: "welder2@example.com",
    date_of_birth: "1985-03-20",
    place_of_birth: "City, State, Country",
    id_method: "ID Card",
    id_number: "ID987654",
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
];

export function buildImportTemplateBuffer(): Buffer {
  const wb = XLSX.utils.book_new();

  const instructionsSheet = XLSX.utils.aoa_to_sheet(INSTRUCTIONS);
  XLSX.utils.book_append_sheet(wb, instructionsSheet, "Instructions");

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
