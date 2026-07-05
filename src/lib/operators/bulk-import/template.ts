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
  OPERATOR_IMPORT_SHEET_NAME,
  OPERATOR_TEMPLATE_COLUMNS,
} from "./columns";

const INSTRUCTIONS = [
  ["WeldDoc — bulk operator import template"],
  [],
  ["Only two columns are required: plant_operator_id (O# No) and full_name."],
  ["Everything else is optional. WeldDoc computes qualified ranges and expiry automatically."],
  [],
  ["Rules"],
  ["• plant_operator_id (O# No) is required (O#01 / O#1 / 1). If it already exists in WeldDoc, the qualification is attached to that operator; otherwise a new operator is created."],
  ["• One row = one qualification. Repeat the operator name and O# on every row for that operator."],
  ["• Leave qualification columns blank to just register an operator (no prior qualification)."],
  ["• Dates are flexible: 2024-06-15, 15/06/2024, 15-06-2024 or 10 May 2023 all work (day-first)."],
  ["• Values are forgiving: paste codes or labels (process \"135\" or \"MAG (135)\"), case does not matter, \"Method 1\" = \"Method_1\", and welder 9.3x maps to operator 6.3x. Extra columns are ignored."],
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

// One operator (O#02) with two qualifications — the same name and O# repeat on
// every row, matching how legacy sheets are laid out.
const EXAMPLE_ROWS = [
  {
    plant_operator_id: "O#02",
    full_name: "Ramesh Kumar",
    welding_type: "Fusion",
    welding_mode: "Mechanized",
    process: "135",
    product_type: "Plate",
    joint_type: "BW",
    qualification_test_method: "Method_1",
    method1_standard: "ISO 9606-1",
    date_of_welding: "2024-06-15",
    revalidation_method: "6.3b",
  },
  {
    plant_operator_id: "O#02",
    full_name: "Ramesh Kumar",
    welding_type: "Fusion",
    welding_mode: "Automatic",
    process: "141",
    product_type: "Pipe",
    joint_type: "BW",
    qualification_test_method: "Method_1",
    method1_standard: "ISO 9606-1",
    date_of_welding: "2024-07-20",
    revalidation_method: "6.3b",
  },
];

export function buildOperatorImportTemplateBuffer(): ArrayBuffer {
  const header = [...OPERATOR_TEMPLATE_COLUMNS];
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
