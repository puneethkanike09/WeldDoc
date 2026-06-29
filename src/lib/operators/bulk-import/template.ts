import * as XLSX from "xlsx";
import { WELDING_PROCESSES } from "@/lib/iso9606/constants";
import {
  FUSION_JOINT_TYPES,
  FUSION_PRODUCT_TYPES,
  METHOD1_STANDARDS,
  QUALIFICATION_TEST_METHODS,
  RESISTANCE_JOINT_TYPES,
  RESISTANCE_PRODUCT_TYPES,
  REVALIDATION_METHODS,
  WELDING_MODES,
  WELDING_TYPES,
} from "@/lib/iso14732/constants";
import {
  OPERATOR_IMPORT_COLUMNS,
  OPERATOR_IMPORT_SHEET_NAME,
} from "./columns";

const INSTRUCTIONS = [
  ["WeldDoc — bulk operator import template"],
  [],
  ["Rules"],
  ["• Dates must be YYYY-MM-DD (e.g. 2024-06-15)."],
  ["• One row = one record. Leave qualification columns blank for operator-only rows."],
  ["• Multiple rows with the same plant_operator_id are allowed if operator details match."],
  ["• plant_operator_id uses O#01 format. Leave blank to auto-assign on import."],
  ["• Employer and branch are taken from organisation settings."],
  ["• Maximum 500 data rows per file."],
  [],
  ["Qualification columns (optional — if any is filled, required fields must be completed)"],
  ["Required: welding_type, welding_mode, process, product_type, joint_type, qualification_test_method, date_of_welding, revalidation_method"],
  [`welding_type — ${WELDING_TYPES.join(" | ")}`],
  [`welding_mode — ${WELDING_MODES.join(" | ")}`],
  [`process — e.g. ${WELDING_PROCESSES.slice(0, 5).map((p) => p.code).join(", ")}…`],
  [`product_type / joint_type — depend on welding_type`],
  [`qualification_test_method — ${QUALIFICATION_TEST_METHODS.map((m) => m.code).join(" | ")}`],
  [`method1_standard — ${METHOD1_STANDARDS.join(" | ")} (Method_1 only)`],
  [`revalidation_method — ${REVALIDATION_METHODS.map((m) => m.code).join(" | ")}`],
  ["result_* columns — Pass | Fail | NA (result_vt defaults Pass)"],
];

const EXAMPLE_ROWS = [
  {
    plant_operator_id: "O#01",
    full_name: "Example Operator (profile only)",
    email: "operator@example.com",
    date_of_birth: "1990-01-15",
    place_of_birth: "City, State, Country",
    id_method: "Passport",
    id_number: "AB123456",
    operator_status: "Active",
  },
  {
    plant_operator_id: "O#02",
    full_name: "Example Operator (with qualification)",
    email: "operator2@example.com",
    date_of_birth: "1985-03-20",
    place_of_birth: "City, Country",
    id_method: "Passport",
    id_number: "CD789012",
    operator_status: "Active",
    welding_type: "Fusion",
    welding_mode: "Mechanized",
    process: "135",
    product_type: "Plate",
    joint_type: "BW",
    qualification_test_method: "Method_1",
    method1_standard: "ISO 9606-1",
    date_of_welding: "2024-06-15",
    revalidation_method: "6.3b",
    examiner_name: "Imported Examiner",
    result_vt: "Pass",
    result_rt_ut_bend: "Pass",
  },
];

export function buildOperatorImportTemplateBuffer(): ArrayBuffer {
  const header = [...OPERATOR_IMPORT_COLUMNS];
  const importData = [
    header,
    ...EXAMPLE_ROWS.map((row) =>
      header.map((col) => row[col as keyof typeof row] ?? ""),
    ),
  ];
  const importSheet = XLSX.utils.aoa_to_sheet(importData);
  const instructionsSheet = XLSX.utils.aoa_to_sheet(INSTRUCTIONS);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, instructionsSheet, "Instructions");
  XLSX.utils.book_append_sheet(wb, importSheet, OPERATOR_IMPORT_SHEET_NAME);
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}
