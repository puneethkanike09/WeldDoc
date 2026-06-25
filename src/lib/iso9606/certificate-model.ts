import type {
  Organization,
  QualificationRecord,
  RangeOfApproval,
  Welder,
} from "@/types/db";
import { fillerTypeCode } from "@/lib/iso9606/filler-types";
import { resolveJointTypes } from "@/lib/iso9606/joint-coverage";
import { parseShieldingGasCode } from "@/lib/iso9606/shielding-gas";
import processRules from "@/lib/range-engine/process-ranges.json";

import {
  formatRangeWithTable,
  layerCode,
  layerRangeText,
  transferModeRangeText,
  weldDetailsRangeText,
} from "@/lib/iso9606/welding-ranges";

export interface CertRow {
  label: string;
  test: string;
  range: string;
  /** ISO 9606-1 table reference shown in the range column (e.g. "Table 6"). */
  tableRef?: string;
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

function subgroupRange(
  group: string | null,
  range: RangeOfApproval | null,
): string {
  if (range?.approved_material_groups?.length) {
    return range.approved_material_groups
      .map((g) => `${g} & ${g}.1`)
      .join(", ");
  }
  return subgroupTest(group);
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

function layerCodeForDesignation(layer: string | null): string {
  return layerCode(layer);
}

function thicknessRangeText(r: RangeOfApproval | null): string {
  if (!r) return "—";
  if (r.thickness_unlimited && r.thickness_min_mm != null)
    return `≥ ${r.thickness_min_mm}`;
  if (r.thickness_min_mm != null && r.thickness_max_mm != null)
    return `${r.thickness_min_mm} – ${r.thickness_max_mm}`;
  return "—";
}

function pipeRangeText(r: RangeOfApproval | null): string {
  if (!r || r.pipe_od_min_mm == null) return "NA";
  if (r.pipe_od_unlimited) return `≥ ${r.pipe_od_min_mm}`;
  return `≥ ${r.pipe_od_min_mm}`;
}

function productRangeText(
  product: string,
  r: RangeOfApproval | null,
): string {
  if (product === "Plate") {
    return r && r.pipe_od_min_mm != null
      ? `Plate & Pipe (D ≥ ${r.pipe_od_min_mm} mm)`
      : "Plate & Pipe";
  }
  if (product === "Pipe" || product === "Branch") {
    return "Pipe & Plate";
  }
  return product;
}

function fillerGroupRange(group: string | null): string {
  if (!group) return "—";
  const map: Record<string, string> = {
    FM1: "FM1 & FM2",
    FM2: "FM1 & FM2",
    FM3: "FM1, FM2 & FM3",
    FM4: "FM1, FM2, FM3 & FM4",
    FM5: "FM5",
    FM6: "FM5 & FM6",
  };
  return map[group] ?? group;
}

function processRangeText(process: string): string {
  const map = processRules as Record<string, string>;
  return map[process] ?? process;
}

function shieldingGasRange(test: string | null): string {
  if (!test) return "—";
  const code = parseShieldingGasCode(test);
  return code ? `ISO 14175 - ${code}` : test;
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
      : wpq.test_thickness_mm != null
        ? `s${wpq.test_thickness_mm}`
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
    layerCodeForDesignation(wpq.layer_type),
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

/** Annex A test-piece table — 16 rows matching the SMS sample layout. */
export function buildCertRows(
  wpq: QualificationRecord,
  range: RangeOfApproval | null,
): CertRow[] {
  const jointTypes = resolveJointTypes(wpq, range);
  const isFillet = wpq.joint_type === "FW";
  const hasSuppFillet = wpq.supplementary_fillet && wpq.joint_type === "BW";
  const positions = range?.approved_positions?.length
    ? range.approved_positions.join(", ")
    : wpq.position ?? "—";
  const thickRange = thicknessRangeText(range);
  const filletThickTest =
    hasSuppFillet && wpq.supplementary_fillet_thickness_mm != null
      ? String(wpq.supplementary_fillet_thickness_mm)
      : null;
  const filletPositionTest = hasSuppFillet
    ? (wpq.supplementary_fillet_position ?? "PB")
    : null;

  const rows: CertRow[] = [
    {
      label: "Welding process(es)",
      test: wpq.process,
      range: processRangeText(wpq.process),
    },
    {
      label: "Transfer mode",
      test: wpq.transfer_mode ?? "—",
      range: formatRangeWithTable(
        transferModeRangeText(wpq.transfer_mode, wpq.process),
        "§5.5",
      ),
      tableRef: "§5.5",
    },
    {
      label: "Product type (plate or pipe)",
      test: wpq.product,
      range: formatRangeWithTable(productRangeText(wpq.product, range), "§5.3"),
      tableRef: "§5.3",
    },
    {
      label: "Type of weld",
      test: weldTypeCode([wpq.joint_type]),
      range: formatRangeWithTable(
        weldTypeCode(jointTypes).replace("/", ", "),
        "§5.1",
      ),
      tableRef: "§5.1",
    },
    {
      label: "Parent material group(s) / subgroups",
      test: subgroupTest(wpq.base_material_group),
      range: formatRangeWithTable(
        subgroupRange(wpq.base_material_group, range),
        "§5.2",
      ),
      tableRef: "§5.2",
    },
    {
      label: "Filler material group(s)",
      test: wpq.filler_group ?? "—",
      range: formatRangeWithTable(fillerGroupRange(wpq.filler_group), "Table 2"),
      tableRef: "Table 2",
    },
    {
      label: "Filler material (designation)",
      test: wpq.filler_designation ?? "—",
      range: "Any filler under qualified FM group",
    },
    {
      label: "Filler material (type)",
      test: wpq.filler_type ?? "—",
      range: formatRangeWithTable(
        wpq.filler_type ?? "—",
        wpq.process === "111" ? "Table 4" : "Table 5",
      ),
      tableRef: wpq.process === "111" ? "Table 4" : "Table 5",
    },
    {
      label: "Shielding gas",
      test: wpq.shielding_gas ?? "—",
      range: shieldingGasRange(wpq.shielding_gas),
    },
    { label: "Auxiliaries", test: "NA", range: "As required" },
    {
      label: "Type of current and polarity",
      test: wpq.current_polarity ?? "—",
      range: "Same as test piece",
    },
    {
      label: "Material thickness (mm)",
      test:
        filletThickTest ??
        (wpq.test_thickness_mm != null ? String(wpq.test_thickness_mm) : "—"),
      range: formatRangeWithTable(
        isFillet || hasSuppFillet ? thickRange : "NA",
        isFillet || hasSuppFillet ? "Table 8" : undefined,
      ),
      tableRef: isFillet || hasSuppFillet ? "Table 8" : undefined,
    },
    {
      label: "Deposited thickness (mm)",
      test:
        wpq.deposited_thickness_mm != null
          ? String(wpq.deposited_thickness_mm)
          : "—",
      range: formatRangeWithTable(
        isFillet ? "NA" : thickRange,
        isFillet ? undefined : "Table 6",
      ),
      tableRef: isFillet ? undefined : "Table 6",
    },
    {
      label: "Outside pipe diameter (mm)",
      test: wpq.pipe_od_mm != null ? String(wpq.pipe_od_mm) : "NA",
      range: formatRangeWithTable(pipeRangeText(range), "Table 7"),
      tableRef: "Table 7",
    },
    {
      label: "Welding position",
      test: filletPositionTest
        ? `${wpq.position ?? "—"} / FW: ${filletPositionTest}`
        : (wpq.position ?? "—"),
      range: formatRangeWithTable(
        positions,
        wpq.joint_type === "FW" || hasSuppFillet ? "Table 9/10" : "Table 9",
      ),
      tableRef: wpq.joint_type === "FW" || hasSuppFillet ? "Table 9/10" : "Table 9",
    },
    {
      label: "Weld details",
      test: wpq.weld_details ?? "—",
      range: formatRangeWithTable(
        weldDetailsRangeText(wpq.weld_details),
        "§11",
      ),
      tableRef: "§11",
    },
    {
      label: "Multi-layer / single layer",
      test: layerCode(wpq.layer_type),
      range: formatRangeWithTable(layerRangeText(wpq.layer_type), "§5.4"),
      tableRef: "§5.4",
    },
  ];

  return rows;
}
