import type {
  Organization,
  QualificationRecord,
  RangeOfApproval,
  Welder,
} from "@/types/db";
import { isBranchQualification } from "@/lib/iso9606/branch-deposited-thickness";
import { formatFilletMaterialRangeText } from "@/lib/range-engine/iso9606";
import rules from "@/lib/range-engine/iso9606.rules.json";
import {
  fillerGroupRangeText,
  fillerTypeRangeText,
  formatPerProcessDepositedRange,
  formatPerProcessPrefixed,
  formatPerProcessTestValues,
  formatDepositedThicknessTest,
  formatMaterialThicknessTest,
  formatPipeOdRange,
  formatPipeOdTest,
  formatThicknessRange,
  getProcessSlices,
  isMultiProcessQualification,
  jointTypeRangeText,
  layerCode,
  layerRangeTextWithSupplementary,
  combinedDesignationFillerTypes,
  combinedDesignationWeldDetails,
  compactWeldDetailsCode,
  designationPositionText,
  materialGroupRangeText,
  positionsRangeText,
  processDisplayText,
  processRangeDisplayText,
  productRangeText,
  shieldingGasDisplay,
  transferModeRangeText,
  weldDetailsRangeText,
  type ProcessSlice,
} from "@/lib/iso9606/certificate-ranges";
import { resolveJointTypes } from "@/lib/iso9606/joint-coverage";
import { listSupplementaryFilletEntries } from "@/lib/iso9606/supplementary-fillet";
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

function filletTestThicknessMm(
  wpq: QualificationRecord,
  process: string,
): number | null {
  if (process === wpq.process) return wpq.test_thickness_mm;
  return wpq.process2_deposited_thickness_mm ?? wpq.test_thickness_mm;
}

function designationLine(
  wpq: QualificationRecord,
  _range: RangeOfApproval | null,
  opts: {
    process: string;
    jointTypes: string[];
    fillerGroup: string | null;
    fillerType: string | null;
    dimension: string;
    weldDetails: string | null;
    layer: string | null;
    /** Test positions for designation (e.g. PA/PC for multi-process). */
    positions?: string | null;
    /** Pre-combined filler code for multi-process (e.g. S/P). */
    fillerTypeLabel?: string;
    /** Pre-combined weld details for multi-process (e.g. ssnb/ssmb). */
    weldDetailsLabel?: string;
    /** BW + supplementary fillet: layer belongs on the FW line only. */
    omitLayer?: boolean;
    /** Fillet weld designations omit weld-detail / backing tokens (ssnb, ssmb). */
    omitWeldDetails?: boolean;
  },
): string {
  // Designation uses the test position code (e.g. H-L045), not the expanded
  // range of approved positions (e.g. PA/PC/PE/PF) — those belong in Annex A.
  const positions = opts.positions ?? wpq.position ?? "";
  const fillerToken =
    opts.fillerTypeLabel ?? fillerTypeCode(opts.fillerType);
  const weldToken = opts.omitWeldDetails
    ? null
    : (opts.weldDetailsLabel ??
      (opts.weldDetails ? compactWeldDetailsCode(opts.weldDetails) : "ssnb"));

  const parts = [
    "ISO 9606-1",
    opts.process,
    productCode(wpq.product),
    weldTypeCode(opts.jointTypes),
    opts.fillerGroup ?? "FM1",
    fillerToken,
    opts.dimension,
    designationPositionText(positions),
    weldToken,
  ];

  if (!opts.omitLayer) {
    parts.push(layerCode(opts.layer));
  }

  return parts.filter(Boolean).join(" ");
}

/**
 * Combined FW designation — one line for multi-process fillet / supplementary fillet.
 * Example: ISO 9606-1 135/136 P FW FM1 S/P t12 PB/PD sl
 * Weld details (ssnb/ssmb) are omitted on fillet lines per ISO 9606-1 practice.
 */
function buildCombinedFilletDesignation(
  wpq: QualificationRecord,
  slices: ProcessSlice[],
  entries: Array<{
    process: string;
    position: string;
    thickness_mm: number | null;
  }>,
): string {
  const processPart = entries.map((e) => e.process).join("/");
  const thicknesses = entries.map((e) => e.thickness_mm);
  const allSameT =
    thicknesses.every((t) => t != null) &&
    thicknesses.every((t) => t === thicknesses[0]);
  const dimension =
    thicknesses.every((t) => t == null)
      ? ""
      : allSameT
        ? `t${thicknesses[0]}`
        : `t${thicknesses.map((t) => (t != null ? String(t) : "—")).join("/")}`;

  const positions = entries.map((e) => e.position).join("/");
  const fillerGroups = entries.map(
    (e) =>
      slices.find((s) => s.process === e.process)?.filler_group ??
      wpq.filler_group,
  );
  const fillerGroup =
    fillerGroups.find(Boolean) ?? wpq.filler_group ?? "FM1";

  const fillerTypeLabel = entries
    .map((e) => {
      const slice = slices.find((s) => s.process === e.process);
      return fillerTypeCode(slice?.filler_type ?? wpq.filler_type);
    })
    .filter(Boolean)
    .join("/");

  const layers = entries.map((e) => {
    const slice = slices.find((s) => s.process === e.process);
    return layerCode(slice?.layer_type ?? wpq.layer_type);
  });
  const layerPart =
    layers.every((l) => l === layers[0]) ? layers[0]! : layers.join("/");

  return [
    "ISO 9606-1",
    processPart,
    productCode(wpq.product),
    "FW",
    fillerGroup,
    fillerTypeLabel,
    dimension,
    positions,
    layerPart,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * ISO 9606-1 designation line(s). Multi-process butt tests use one line with
 * p1/p2 and s1/s2; supplementary fillet adds a combined FW line (no weld details).
 */
export function buildDesignation(
  wpq: QualificationRecord,
  range: RangeOfApproval | null,
): string[] {
  const jointTypes = resolveJointTypes(wpq, range);
  const suppEntries = listSupplementaryFilletEntries(wpq);
  const hasSuppFillet = suppEntries.length > 0;
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
        weldDetails: null,
        layer: wpq.layer_type,
        omitWeldDetails: true,
      }),
    );
    return lines;
  }

  if (isFillet && multi) {
    const slices = getProcessSlices(wpq);
    const entries = slices.map((s) => ({
      process: s.process,
      position: s.position ?? wpq.position ?? "PA",
      thickness_mm: filletTestThicknessMm(wpq, s.process),
    }));
    lines.push(buildCombinedFilletDesignation(wpq, slices, entries));
    return lines;
  }

  const processPart = multi
    ? `${wpq.process}/${wpq.process_2}`
    : wpq.process;

  const slices = multi ? getProcessSlices(wpq) : [];

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
      positions:
        multi && wpq.position_2 && wpq.position
          ? `${wpq.position} & ${wpq.position_2}`
          : null,
      fillerTypeLabel: multi ? combinedDesignationFillerTypes(slices) : undefined,
      weldDetailsLabel: multi ? combinedDesignationWeldDetails(slices) : undefined,
      omitLayer: hasSuppFillet,
    }),
  );

  if (hasSuppFillet) {
    const processSlices = getProcessSlices(wpq);
    if (suppEntries.length === 1) {
      const entry = suppEntries[0]!;
      const filletSlice = processSlices.find((s) => s.process === entry.process);
      lines.push(
        designationLine(wpq, range, {
          process: entry.process,
          jointTypes: ["FW"],
          fillerGroup: filletSlice?.filler_group ?? wpq.filler_group,
          fillerType: filletSlice?.filler_type ?? wpq.filler_type,
          dimension: entry.thickness_mm != null ? `t${entry.thickness_mm}` : "",
          weldDetails: null,
          layer: filletSlice?.layer_type ?? wpq.layer_type,
          positions: entry.position,
          omitWeldDetails: true,
        }),
      );
    } else {
      lines.push(
        buildCombinedFilletDesignation(wpq, processSlices, suppEntries),
      );
    }
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
  const ref = welder.welder_id ?? "—";
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
  const suppEntries = listSupplementaryFilletEntries(wpq);
  const hasSuppFillet = suppEntries.length > 0;
  const thickRange = formatThicknessRange(range);
  const slices = getProcessSlices(wpq);
  const multi = slices.length > 1;

  const positions = range?.approved_positions?.length
    ? range.approved_positions
    : wpq.position
      ? [wpq.position]
      : [];

  const fwPositionRange = (position: string) =>
    positionsRangeText(
      (rules as { positionMapFw: Record<string, string[]> }).positionMapFw[
        position
      ] ?? [position],
    );

  const materialThickTest = hasSuppFillet
    ? suppEntries
        .map((e) =>
          formatMaterialThicknessTest(e.thickness_mm, {
            process:
              suppEntries.length > 1 || multi ? e.process : undefined,
          }),
        )
        .join(" & ")
    : isFillet && multi
      ? formatPerProcessTestValues(slices, (s) => {
          const t = filletTestThicknessMm(wpq, s.process);
          return t != null ? formatMaterialThicknessTest(t) : "—";
        })
    : isFillet && wpq.test_thickness_mm != null
      ? formatMaterialThicknessTest(wpq.test_thickness_mm)
      : "—";

  const materialThickRange = isFillet
    ? thickRange
    : hasSuppFillet
      ? suppEntries
          .map((e) => `${e.process}: ${formatFilletMaterialRangeText(e.thickness_mm)}`)
          .join(" / ")
      : "NA";

  const positionTest = hasSuppFillet
    ? `BW: ${multi ? formatPerProcessTestValues(slices, (s) => s.position ?? "—") : (wpq.position ?? "—")} & ${suppEntries
        .map((e) => `FW (${e.process}): ${e.position}`)
        .join(" & ")}`
    : isFillet && multi
      ? formatPerProcessTestValues(slices, (s) => s.position ?? "—")
    : multi
      ? formatPerProcessTestValues(slices, (s) => s.position ?? "—")
      : (wpq.position ?? "—");

  const positionRange = hasSuppFillet
    ? `BW: ${positionsRangeText(positions)} & ${suppEntries
        .map((e) => `FW (${e.process}): ${fwPositionRange(e.position)}`)
        .join(" & ")}`
    : isFillet && multi
      ? formatPerProcessPrefixed(slices, (s) =>
          fwPositionRange(s.position ?? ""),
        )
    : multi
      ? formatPerProcessPrefixed(slices, (s) =>
          positionsRangeText(
            (rules as { positionMapBw: Record<string, string[]> }).positionMapBw[
              s.position ?? ""
            ] ??
              (rules as { positionMapFw: Record<string, string[]> }).positionMapFw[
                s.position ?? ""
              ] ??
              (s.position ? [s.position] : []),
          ),
        )
      : positionsRangeText(positions);

  const depositedTest = isFillet
    ? "—"
    : formatDepositedThicknessTest(slices);

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
            layerRangeTextWithSupplementary(
              s.layer_type,
              hasSuppFillet,
            ),
          )
        : layerRangeTextWithSupplementary(
            wpq.layer_type,
            hasSuppFillet,
          ),
    },
  ];
}
