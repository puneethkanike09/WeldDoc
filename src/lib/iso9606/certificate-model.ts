import type {
  Organization,
  QualificationRecord,
  RangeOfApproval,
  Welder,
} from "@/types/db";
import { branchDepositedThicknessTest, isBranchQualification } from "@/lib/iso9606/branch-deposited-thickness";
import { formatFilletMaterialRangeText } from "@/lib/range-engine/iso9606";
import rules from "@/lib/range-engine/iso9606.rules.json";
import {
  fillerGroupRangeText,
  fillerTypeRangeText,
  formatPipeOdRange,
  formatPipeOdTest,
  formatThicknessRange,
  jointTypeRangeText,
  layerCode,
  layerRangeText,
  materialGroupRangeText,
  positionsRangeText,
  processRangeText,
  productRangeText,
  transferModeRangeText,
  weldDetailsRangeText,
} from "@/lib/iso9606/certificate-ranges";
import { resolveJointTypes } from "@/lib/iso9606/joint-coverage";
import { fillerTypeCode } from "@/lib/iso9606/filler-types";
import { displayJointType } from "@/lib/iso9606/product-dimensions";

export interface CertRow {
  label: string;
  test: string;
  range: string;
}

function materialCode(group: string | null): string {
  const major = group?.split(".")[0] ?? group;
  if (!major) return "CS";
  if (["1", "2", "3"].includes(major)) return "CS";
  if (["8", "10"].includes(major)) return "SS";
  if (["4", "5", "6"].includes(major)) return "CrMo";
  return `M${major}`;
}

function subgroupTest(group: string | null): string {
  if (!group) return "—";
  if (group.includes(".")) return group;
  return `${group}.1`;
}

function productCode(product: string): string {
  return product === "Pipe" || product === "Branch" ? "T" : "P";
}

function weldTypeCode(jointTypes: string[]): string {
  const hasBW = jointTypes.includes("BW");
  const hasFW = jointTypes.includes("FW");
  if (hasBW && hasFW) return "BW/FW";
  return hasBW ? "BW" : "FW";
}

export function buildDesignation(
  wpq: QualificationRecord,
  range: RangeOfApproval | null,
): string {
  const jointTypes = resolveJointTypes(wpq, range);
  const positions = range?.approved_positions?.length
    ? range.approved_positions.join("/")
    : wpq.position ?? "";
  const ft = fillerTypeCode(wpq.filler_type);
  const isFillet = wpq.joint_type === "FW";
  const dimension = isFillet
    ? wpq.test_thickness_mm != null
      ? `t${wpq.test_thickness_mm}`
      : ""
    : wpq.deposited_thickness_mm != null
      ? `s${wpq.deposited_thickness_mm}`
      : "";

  return [
    "EN ISO 9606-1",
    wpq.process,
    productCode(wpq.product),
    weldTypeCode(jointTypes),
    wpq.filler_group ?? "FM1",
    ft,
    dimension,
    positions.replace(/\//g, "&"),
    wpq.weld_details ?? "ss nb",
    layerCode(wpq.layer_type),
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildCertNo(
  org: Organization,
  welder: Welder,
  wpq: QualificationRecord,
): string {
  const base = (org.report_prefix || "WPQ-")
    .replace(/WPQ-?$/i, "")
    .replace(/\/$/, "");
  const ref = welder.welder_id || welder.uid;
  const pos = wpq.position ?? "PA";
  const mat = materialCode(wpq.base_material_group);
  return `${base}/${wpq.process}/${pos}(${mat})-${ref}`;
}

/** Annex A — test piece vs range of qualification (EN ISO 9606-1). */
export function buildCertRows(
  wpq: QualificationRecord,
  range: RangeOfApproval | null,
): CertRow[] {
  const jointTypes = resolveJointTypes(wpq, range);
  const isFillet = wpq.joint_type === "FW";
  const hasSuppFillet = wpq.supplementary_fillet && wpq.joint_type === "BW";
  const thickRange = formatThicknessRange(range);
  const positions = range?.approved_positions?.length
    ? range.approved_positions
    : wpq.position
      ? [wpq.position]
      : [];

  const materialThickTest = hasSuppFillet
    ? wpq.supplementary_fillet_thickness_mm != null
      ? String(wpq.supplementary_fillet_thickness_mm)
      : "—"
    : isFillet && wpq.test_thickness_mm != null
      ? String(wpq.test_thickness_mm)
      : "—";

  const materialThickRange = isFillet
    ? thickRange
    : hasSuppFillet
      ? formatFilletMaterialRangeText(wpq.supplementary_fillet_thickness_mm)
      : "NA";

  const positionTest = hasSuppFillet
    ? `${wpq.position ?? "—"} / FW: ${wpq.supplementary_fillet_position ?? "PB"}`
    : (wpq.position ?? "—");

  const positionRange = hasSuppFillet
    ? `${positionsRangeText(positions)}; FW: ${positionsRangeText(
        wpq.supplementary_fillet_position
          ? ((rules as { positionMapFw: Record<string, string[]> }).positionMapFw[
              wpq.supplementary_fillet_position
            ] ?? [wpq.supplementary_fillet_position])
          : [],
      )}`
    : positionsRangeText(positions);

  const depositedTest = branchDepositedThicknessTest(wpq);
  const depositedRange = isFillet ? "NA" : thickRange;

  const weldTypeTest = isBranchQualification(wpq)
    ? "Branch (BW)"
    : wpq.joint_type;

  const weldTypeRange =
    wpq.product === "Other"
      ? displayJointType(wpq)
      : jointTypeRangeText(jointTypes);

  return [
    {
      label: "Welding process(es)",
      test: wpq.process,
      range: processRangeText(wpq.process),
    },
    {
      label: "Transfer mode",
      test: wpq.transfer_mode ?? "NA",
      range: transferModeRangeText(wpq.transfer_mode, wpq.process),
    },
    {
      label: "Product type (plate or pipe)",
      test: wpq.product === "Other" ? "Others" : wpq.product,
      range: productRangeText(wpq),
    },
    {
      label: "Type of weld",
      test: weldTypeTest,
      range: weldTypeRange,
    },
    {
      label: "Parent material group(s) / subgroups",
      test: subgroupTest(wpq.base_material_group),
      range: materialGroupRangeText(wpq.base_material_group, range),
    },
    {
      label: "Filler material group(s)",
      test: wpq.filler_group ?? "—",
      range: fillerGroupRangeText(wpq.filler_group),
    },
    {
      label: "Filler material (designation)",
      test: wpq.filler_designation ?? "—",
      range: "Any filler within qualified FM group",
    },
    {
      label: "Filler material (type)",
      test: wpq.filler_type ?? "—",
      range: fillerTypeRangeText(wpq.filler_type, wpq.process),
    },
    {
      label: "Shielding gas",
      test: wpq.shielding_gas ?? "—",
      range: "As per qualified WPS",
    },
    { label: "Auxiliaries", test: "NA", range: "As required" },
    {
      label: "Type of current and polarity",
      test: wpq.current_polarity ?? "—",
      range: wpq.current_polarity ?? "—",
    },
    {
      label: "Material thickness (mm)",
      test: materialThickTest,
      range: materialThickRange,
    },
    {
      label: "Deposited thickness (mm)",
      test: depositedTest,
      range: depositedRange,
    },
    {
      label: "Outside pipe diameter (mm)",
      test: formatPipeOdTest(wpq),
      range: formatPipeOdRange(wpq, range),
    },
    {
      label: "Welding position",
      test: positionTest,
      range: positionRange,
    },
    {
      label: "Weld details",
      test: wpq.weld_details ?? "—",
      range: weldDetailsRangeText(wpq.weld_details),
    },
    {
      label: "Multi-layer / single layer",
      test: layerCode(wpq.layer_type),
      range: layerRangeText(wpq.layer_type),
    },
  ];
}
