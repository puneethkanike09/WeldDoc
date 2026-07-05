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
  formatPerProcessDepositedRange,
  formatPerProcessPrefixed,
  formatPerProcessTestValues,
  formatPipeOdRange,
  formatPipeOdTest,
  formatThicknessRange,
  getProcessSlices,
  isMultiProcessQualification,
  jointTypeRangeText,
  layerCode,
  layerRangeText,
  materialGroupRangeText,
  positionsRangeText,
  processDisplayText,
  processRangeDisplayText,
  productRangeText,
  shieldingGasDisplay,
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

function designationLine(
  wpq: QualificationRecord,
  range: RangeOfApproval | null,
  opts: {
    process: string;
    jointTypes: string[];
    fillerGroup: string | null;
    fillerType: string | null;
    dimension: string;
    weldDetails: string | null;
    layer: string | null;
  },
): string {
  const positions = range?.approved_positions?.length
    ? range.approved_positions.join("/")
    : wpq.position ?? "";

  return [
    "EN ISO 9606-1",
    opts.process,
    productCode(wpq.product),
    weldTypeCode(opts.jointTypes),
    opts.fillerGroup ?? "FM1",
    fillerTypeCode(opts.fillerType),
    opts.dimension,
    positions.replace(/\//g, "&"),
    opts.weldDetails ?? "ss nb",
    layerCode(opts.layer),
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * ISO 9606-1 designation line(s). Multi-process butt tests use one line with
 * p1/p2 and s1/s2; supplementary fillet adds a second FW line for the fillet
 * process.
 */
export function buildDesignation(
  wpq: QualificationRecord,
  range: RangeOfApproval | null,
): string[] {
  const jointTypes = resolveJointTypes(wpq, range);
  const hasSuppFillet = wpq.supplementary_fillet && wpq.joint_type === "BW";
  const isFillet = wpq.joint_type === "FW";
  const multi = isMultiProcessQualification(wpq);
  const lines: string[] = [];

  if (isFillet && !multi) {
    const dimension =
      wpq.test_thickness_mm != null ? `t${wpq.test_thickness_mm}` : "";
    lines.push(
      designationLine(wpq, range, {
        process: wpq.process,
        jointTypes,
        fillerGroup: wpq.filler_group,
        fillerType: wpq.filler_type,
        dimension,
        weldDetails: wpq.weld_details,
        layer: wpq.layer_type,
      }),
    );
    return lines;
  }

  const processPart = multi
    ? `${wpq.process}/${wpq.process_2}`
    : wpq.process;

  let dimension = "";
  if (multi) {
    const s1 = wpq.deposited_thickness_mm;
    const s2 = wpq.process2_deposited_thickness_mm;
    if (s1 != null && s2 != null) dimension = `s${s1}/${s2}`;
    else if (s1 != null) dimension = `s${s1}`;
    else if (s2 != null) dimension = `s${s2}`;
  } else if (wpq.deposited_thickness_mm != null) {
    dimension = `s${wpq.deposited_thickness_mm}`;
  }

  lines.push(
    designationLine(wpq, range, {
      process: processPart,
      jointTypes: hasSuppFillet ? ["BW"] : jointTypes,
      fillerGroup: wpq.filler_group,
      fillerType: wpq.filler_type,
      dimension,
      weldDetails: wpq.weld_details,
      layer: wpq.layer_type,
    }),
  );

  if (hasSuppFillet) {
    const filletProcess =
      wpq.supplementary_fillet_process ?? wpq.process;
    const filletSlice = getProcessSlices(wpq).find(
      (s) => s.process === filletProcess,
    );
    const t = wpq.supplementary_fillet_thickness_mm;
    const filletPos =
      wpq.supplementary_fillet_position?.replace(/\//g, "&") ?? "PB";

    lines.push(
      [
        "EN ISO 9606-1",
        filletProcess,
        productCode(wpq.product),
        "FW",
        (filletSlice?.filler_group ?? wpq.filler_group) ?? "FM1",
        fillerTypeCode(filletSlice?.filler_type ?? wpq.filler_type),
        t != null ? `t${t}` : "",
        filletPos,
        filletSlice?.weld_details ?? wpq.weld_details ?? "ss nb",
        layerCode(filletSlice?.layer_type ?? wpq.layer_type),
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  return lines;
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
  const proc = wpq.process_2
    ? `${wpq.process}+${wpq.process_2}`
    : wpq.process;
  return `${base}/${proc}/${pos}(${mat})-${ref}`;
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
  const slices = getProcessSlices(wpq);
  const multi = slices.length > 1;

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
    ? `BW: ${wpq.position ?? "—"} & FW: ${wpq.supplementary_fillet_position ?? "PB"}`
    : (wpq.position ?? "—");

  const positionRange = hasSuppFillet
    ? `BW: ${positionsRangeText(positions)} & FW: ${positionsRangeText(
        wpq.supplementary_fillet_position
          ? ((rules as { positionMapFw: Record<string, string[]> }).positionMapFw[
              wpq.supplementary_fillet_position
            ] ?? [wpq.supplementary_fillet_position])
          : [],
      )}`
    : positionsRangeText(positions);

  const depositedTest = multi
    ? formatPerProcessTestValues(slices, (s) =>
        s.deposited_thickness_mm != null
          ? String(s.deposited_thickness_mm)
          : null,
      )
    : branchDepositedThicknessTest(wpq);

  const depositedRange = isFillet
    ? "NA"
    : multi
      ? formatPerProcessDepositedRange(slices)
      : thickRange;

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
      test: processDisplayText(wpq),
      range: processRangeDisplayText(wpq),
    },
    {
      label: "Transfer mode",
      test: multi
        ? formatPerProcessTestValues(slices, (s) => s.transfer_mode ?? "NA")
        : (wpq.transfer_mode ?? "NA"),
      range: multi
        ? formatPerProcessPrefixed(slices, (s) =>
            transferModeRangeText(s.transfer_mode, s.process),
          )
        : transferModeRangeText(wpq.transfer_mode, wpq.process),
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
      test: multi
        ? formatPerProcessTestValues(slices, (s) => s.filler_group)
        : (wpq.filler_group ?? "—"),
      range: multi
        ? formatPerProcessPrefixed(slices, (s) =>
            fillerGroupRangeText(s.filler_group),
          )
        : fillerGroupRangeText(wpq.filler_group),
    },
    {
      label: "Filler material (designation)",
      test: multi
        ? formatPerProcessPrefixed(
            slices,
            (s) => s.filler_designation ?? "—",
          )
        : (wpq.filler_designation ?? "—"),
      range: "Any filler within qualified FM group",
    },
    {
      label: "Filler material (type)",
      test: multi
        ? formatPerProcessPrefixed(slices, (s) => s.filler_type ?? "—")
        : (wpq.filler_type ?? "—"),
      range: multi
        ? formatPerProcessPrefixed(slices, (s) =>
            fillerTypeRangeText(s.filler_type, s.process),
          )
        : fillerTypeRangeText(wpq.filler_type, wpq.process),
    },
    {
      label: "Shielding gas",
      test: multi
        ? formatPerProcessPrefixed(slices, (s) =>
            shieldingGasDisplay(s.shielding_gas),
          )
        : shieldingGasDisplay(wpq.shielding_gas),
      range: "As per qualified WPS",
    },
    { label: "Auxiliaries", test: "NA", range: "As required" },
    {
      label: "Type of current and polarity",
      test: multi
        ? formatPerProcessPrefixed(
            slices,
            (s) => s.current_polarity ?? "—",
          )
        : (wpq.current_polarity ?? "—"),
      range: multi
        ? formatPerProcessPrefixed(
            slices,
            (s) => s.current_polarity ?? "—",
          )
        : (wpq.current_polarity ?? "—"),
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
      test: multi
        ? formatPerProcessTestValues(slices, (s) => s.weld_details)
        : (wpq.weld_details ?? "—"),
      range: multi
        ? formatPerProcessPrefixed(slices, (s) =>
            weldDetailsRangeText(s.weld_details),
          )
        : weldDetailsRangeText(wpq.weld_details),
    },
    {
      label: "Multi-layer / single layer",
      test: multi
        ? formatPerProcessTestValues(slices, (s) => layerCode(s.layer_type))
        : layerCode(wpq.layer_type),
      range: multi
        ? formatPerProcessPrefixed(slices, (s) =>
            layerRangeText(s.layer_type),
          )
        : layerRangeText(wpq.layer_type),
    },
  ];
}
