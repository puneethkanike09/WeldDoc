import {
  BW_POSITIONS,
  FW_POSITIONS,
  FILLER_GROUPS,
  JOINT_TYPES,
  MATERIAL_GROUPS,
  PRODUCT_TYPES,
  REVALIDATION_METHODS,
  TESTING_STANDARDS,
  WELDING_PROCESSES,
} from "@/lib/iso9606/constants";
import type { ImportColumnKey } from "./columns";

export type SelectOption = { value: string; label: string };

export type ImportFieldKind =
  | { type: "text" }
  | { type: "number"; step?: string }
  | { type: "date" }
  | { type: "select"; options: SelectOption[]; allowEmpty?: boolean }
  | { type: "position" };

const NDT_OPTIONS: SelectOption[] = [
  { value: "Pass", label: "Pass" },
  { value: "Fail", label: "Fail" },
  { value: "NA", label: "NA" },
];

const WELDER_STATUS_OPTIONS: SelectOption[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Suspended", label: "Suspended" },
];

function codeOptions(
  items:
    | readonly { code: string; label?: string; name?: string }[]
    | readonly string[],
): SelectOption[] {
  return items.map((item) =>
    typeof item === "string"
      ? { value: item, label: item }
      : { value: item.code, label: item.label ?? item.name ?? item.code },
  );
}

export function positionOptionsForJoint(jointType: string): SelectOption[] {
  const codes =
    jointType === "FW"
      ? FW_POSITIONS
      : jointType === "BW"
        ? BW_POSITIONS
        : [...BW_POSITIONS, ...FW_POSITIONS];
  return codes.map((code) => ({ value: code, label: code }));
}

export function getImportFieldKind(column: ImportColumnKey): ImportFieldKind {
  switch (column) {
    case "plant_welder_id":
    case "full_name":
    case "place_of_birth":
    case "photo_filename":
      return { type: "text" };
    case "id_number":
      return { type: "number", step: "1" };
    case "date_of_birth":
    case "date_of_welding":
    case "expiry_date":
    case "continuity_last_verified":
      return { type: "date" };
    case "continuity_history":
    case "revalidation_history":
      return { type: "text" };
    case "test_thickness_mm":
    case "deposited_thickness_mm":
    case "pipe_od_mm":
      return { type: "number", step: "0.1" };
    case "id_method":
      return { type: "text" };
    case "welder_status":
      return { type: "select", options: WELDER_STATUS_OPTIONS };
    case "process":
      return {
        type: "select",
        options: codeOptions(WELDING_PROCESSES),
        allowEmpty: true,
      };
    case "joint_type":
      return {
        type: "select",
        options: codeOptions(JOINT_TYPES),
        allowEmpty: true,
      };
    case "position":
      return { type: "position" };
    case "base_material_group":
      return {
        type: "select",
        options: codeOptions(MATERIAL_GROUPS),
        allowEmpty: true,
      };
    case "filler_group":
      return {
        type: "select",
        options: codeOptions(FILLER_GROUPS),
        allowEmpty: true,
      };
    case "product":
      return {
        type: "select",
        options: PRODUCT_TYPES.map((v) => ({ value: v, label: v })),
        allowEmpty: true,
      };
    case "testing_standard":
      return {
        type: "select",
        options: codeOptions(TESTING_STANDARDS),
        allowEmpty: true,
      };
    case "revalidation_method":
      return {
        type: "select",
        options: codeOptions(REVALIDATION_METHODS),
        allowEmpty: true,
      };
    case "result_vt":
    case "result_rt_ut":
    case "result_fracture":
      return { type: "select", options: NDT_OPTIONS, allowEmpty: true };
    default:
      return { type: "text" };
  }
}
