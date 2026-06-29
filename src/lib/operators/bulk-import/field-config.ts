import type { OperatorImportColumnKey } from "./columns";

type FieldKind =
  | { type: "text" }
  | { type: "date" }
  | { type: "select"; options: string[] };

const DATE_COLUMNS = new Set<OperatorImportColumnKey>([
  "date_of_birth",
  "date_of_welding",
  "expiry_date",
  "continuity_last_verified",
]);

const NDT_COLUMNS = new Set<OperatorImportColumnKey>([
  "result_vt",
  "result_mt_pt",
  "result_macro",
  "result_bend_or_macro",
  "result_fracture_macro",
  "result_rt_ut_bend",
  "result_ut_bend",
]);

export function getOperatorImportFieldKind(
  column: OperatorImportColumnKey,
): FieldKind {
  if (DATE_COLUMNS.has(column)) return { type: "date" };
  if (column === "operator_status") {
    return { type: "select", options: ["Active", "Inactive", "Suspended"] };
  }
  if (column === "welding_type") {
    return { type: "select", options: ["Fusion", "Resistance"] };
  }
  if (column === "welding_mode") {
    return { type: "select", options: ["Mechanized", "Automatic"] };
  }
  if (column === "qualification_test_method") {
    return {
      type: "select",
      options: ["Method_1", "Method_2", "Method_3", "Method_4"],
    };
  }
  if (column === "method1_standard") {
    return { type: "select", options: ["ISO 9606-1", "ISO 9606-2"] };
  }
  if (column === "revalidation_method") {
    return { type: "select", options: ["6.3a", "6.3b", "6.3c"] };
  }
  if (NDT_COLUMNS.has(column)) {
    return { type: "select", options: ["Pass", "Fail", "NA"] };
  }
  return { type: "text" };
}
