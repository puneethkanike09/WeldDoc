/**
 * Human-readable certificate range text derived from EN ISO 9606-1:2017.
 * Range column shows qualified values — not table numbers or clause references.
 */

import type { QualificationRecord, RangeOfApproval } from "@/types/db";
import { branchPipeOdTestMm, isBranchQualification } from "@/lib/iso9606/branch-deposited-thickness";
import { displayJointType } from "@/lib/iso9606/product-dimensions";
import rules from "@/lib/range-engine/iso9606.rules.json";

type Rules = typeof rules & {
  processRanges: Record<string, string>;
  fillerGroupRanges: Record<string, string>;
  weldDetailRanges: Record<string, string>;
  layerRanges: Record<string, string>;
  gmaWProcesses: string[];
  pipeOd: { plateFixedPipeMinMm: number; plateRotatingPipeMinMm: number };
};

const r = rules as Rules;

export function formatThicknessRange(range: RangeOfApproval | null): string {
  if (!range || range.thickness_min_mm == null) return "—";
  if (range.thickness_unlimited) return `≥ ${range.thickness_min_mm} mm`;
  if (range.thickness_max_mm != null) {
    return `${range.thickness_min_mm} – ${range.thickness_max_mm} mm`;
  }
  return `≥ ${range.thickness_min_mm} mm`;
}

export function formatPipeOdRange(
  wpq: Pick<QualificationRecord, "product" | "joint_type_extended" | "branch_connection">,
  range: RangeOfApproval | null,
): string {
  if (wpq.product === "Plate") {
    return `Fixed pipe ≥ ${r.pipeOd.plateFixedPipeMinMm} mm; rotating pipe ≥ ${r.pipeOd.plateRotatingPipeMinMm} mm (PA, PC)`;
  }
  if (isBranchQualification(wpq)) {
    if (range?.pipe_od_min_mm != null) {
      return `Branch OD ≥ ${range.pipe_od_min_mm} mm`;
    }
    return "—";
  }
  if (!range || range.pipe_od_min_mm == null) return "—";
  if (range.pipe_od_unlimited) return `≥ ${range.pipe_od_min_mm} mm`;
  return `≥ ${range.pipe_od_min_mm} mm`;
}

export function formatPipeOdTest(
  wpq: Pick<
    QualificationRecord,
    "product" | "pipe_od_mm" | "dimension2_pipe_od_mm" | "joint_type_extended"
  >,
): string {
  if (wpq.product === "Plate") return "NA";
  const od = branchPipeOdTestMm(wpq);
  return od != null ? String(od) : "—";
}

export function processRangeText(process: string): string {
  return r.processRanges[process] ?? process;
}

export function fillerGroupRangeText(group: string | null): string {
  if (!group) return "—";
  return r.fillerGroupRanges[group] ?? group;
}

export function weldDetailsRangeText(test: string | null): string {
  if (!test) return "—";
  const key = test.trim().toLowerCase();
  return r.weldDetailRanges[key] ?? test;
}

export function layerRangeText(layer: string | null): string {
  const code = !layer || /single|sl/i.test(layer) ? "sl" : "ml";
  return r.layerRanges[code] ?? code;
}

export function layerCode(layer: string | null): string {
  return !layer || /single|sl/i.test(layer) ? "sl" : "ml";
}

export function transferModeRangeText(
  mode: string | null,
  process: string,
): string {
  if (!mode || mode === "N/A") return "NA";
  if (!r.gmaWProcesses.includes(process)) return "NA";
  return mode;
}

export function productRangeText(
  wpq: Pick<QualificationRecord, "product" | "joint_type" | "joint_type_extended">,
): string {
  if (wpq.product === "Other") {
    return displayJointType(wpq);
  }
  if (wpq.product === "Plate") {
    return "Plate and pipe";
  }
  return "Pipe and plate";
}

export function jointTypeRangeText(jointTypes: string[]): string {
  const hasBW = jointTypes.includes("BW");
  const hasFW = jointTypes.includes("FW");
  if (hasBW && hasFW) return "BW, FW";
  return hasBW ? "BW" : "FW";
}

export function materialGroupRangeText(
  group: string | null,
  range: RangeOfApproval | null,
): string {
  if (range?.approved_material_groups?.length) {
    return range.approved_material_groups
      .map((g) => `${g} & ${g}.1`)
      .join(", ");
  }
  if (!group) return "—";
  return `${group} & ${group}.1`;
}

export function positionsRangeText(positions: string[]): string {
  return positions.length ? positions.join(", ") : "—";
}
