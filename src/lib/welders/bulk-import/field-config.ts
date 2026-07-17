import {
  BW_POSITIONS,
  FW_POSITIONS,
  FILLER_GROUPS,
  REVALIDATION_METHODS,
} from "@/lib/iso9606/constants";
import type { ImportColumnKey } from "./columns";

export type SelectOption = { value: string; label: string };

export type ImportFieldKind =
  | { type: "text" }
  | { type: "number"; step?: string }
  | { type: "date" }
  | { type: "select"; options: SelectOption[]; allowEmpty?: boolean }
  | { type: "position" };

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

const JOINT_MODE_OPTIONS: SelectOption[] = [
  { value: "BW", label: "BW" },
  { value: "FW", label: "FW" },
  { value: "BW/FW", label: "BW/FW" },
];

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
    case "welder_id":
    case "full_name":
    case "id_method":
    case "photo_filename":
    case "process":
      return { type: "text" };
    case "id_number":
      return { type: "number", step: "1" };
    case "date_of_birth":
    case "weld_test_revalidation_date":
    case "validation_expiry_date":
      return { type: "date" };
    case "continuity_last_verified":
      // May hold multiple semicolon-separated dates — free text, not a
      // single date picker.
      return { type: "text" };
    case "bw_test_thickness_mm":
    case "fw_test_thickness_mm":
    case "pipe_od_mm":
      return { type: "number", step: "0.1" };
    case "joint_type":
      return {
        type: "select",
        options: JOINT_MODE_OPTIONS,
        allowEmpty: true,
      };
    case "bw_position":
    case "fw_position":
      return { type: "position" };
    case "filler_group":
      return {
        type: "select",
        options: codeOptions(FILLER_GROUPS),
        allowEmpty: true,
      };
    case "revalidation_method":
      return {
        type: "select",
        options: codeOptions(REVALIDATION_METHODS),
        allowEmpty: true,
      };
    default:
      return { type: "text" };
  }
}
