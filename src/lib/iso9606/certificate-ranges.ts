/**
 * Human-readable certificate range text derived from EN ISO 9606-1:2017.
 * Range column shows qualified values — not table numbers or clause references.
 */

import type { QualificationRecord, RangeOfApproval } from "@/types/db";
import { isMultiProcessQualification } from "@/lib/iso9606/constants";
import { fillerTypeCode } from "@/lib/iso9606/filler-types";
import { branchPipeOdTestMm, isBranchQualification } from "@/lib/iso9606/branch-deposited-thickness";
import { fillerTypeQualificationRange } from "@/lib/iso9606/filler-types";
import { displayJointType } from "@/lib/iso9606/product-dimensions";
import { computeTable6DepositedRange } from "@/lib/range-engine/iso9606";
import { normalizeShieldingGas } from "@/lib/iso9606/shielding-gas";
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

/** PDF-safe minimum thickness text (Helvetica lacks U+2265). */
export function formatMinMm(value: number): string {
  return `>= ${value} mm`;
}

export function formatThicknessRange(range: RangeOfApproval | null): string {
  if (!range || range.thickness_min_mm == null) return "—";
  if (range.thickness_unlimited) return formatMinMm(range.thickness_min_mm);
  if (range.thickness_max_mm != null) {
    return `${range.thickness_min_mm} – ${range.thickness_max_mm} mm`;
  }
  return formatMinMm(range.thickness_min_mm);
}

export function formatPipeOdRange(
  wpq: Pick<QualificationRecord, "product" | "joint_type_extended" | "branch_connection">,
  range: RangeOfApproval | null,
): string {
  if (wpq.product === "Plate") {
    return `Fixed pipe >= ${r.pipeOd.plateFixedPipeMinMm} mm; rotating pipe >= ${r.pipeOd.plateRotatingPipeMinMm} mm (PA, PB, PC, PD)`;
  }
  if (isBranchQualification(wpq)) {
    if (range?.pipe_od_min_mm != null) {
      return formatMinMm(range.pipe_od_min_mm);
    }
    return "—";
  }
  if (!range || range.pipe_od_min_mm == null) return "—";
  if (range.pipe_od_max_mm != null) {
    return `${range.pipe_od_min_mm} – ${range.pipe_od_max_mm} mm`;
  }
  if (range.pipe_od_unlimited) return formatMinMm(range.pipe_od_min_mm);
  return formatMinMm(range.pipe_od_min_mm);
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

export function fillerTypeRangeText(
  fillerType: string | null | undefined,
  process: string,
): string {
  return fillerTypeQualificationRange(fillerType, process);
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

/** Annex A layer range — supplementary fillet qualifies sl and ml (FW). */
export function layerRangeTextWithSupplementary(
  layer: string | null,
  supplementaryFillet: boolean,
): string {
  if (supplementaryFillet) return "sl & ml";
  return layerRangeText(layer);
}

export function layerCode(layer: string | null): string {
  return !layer || /single|sl/i.test(layer) ? "sl" : "ml";
}

/** Designation weld-detail token without spaces (e.g. ss nb → ssnb). */
export function compactWeldDetailsCode(details: string | null | undefined): string {
  if (!details?.trim()) return "ssnb";
  return details.replace(/\s+/g, "");
}

/** Multi-process designation filler codes, e.g. S/P. */
export function combinedDesignationFillerTypes(
  slices: ProcessSlice[],
): string {
  const codes = slices
    .map((s) => fillerTypeCode(s.filler_type))
    .filter(Boolean);
  return codes.length > 1 ? codes.join("/") : (codes[0] ?? "");
}

/** Multi-process designation weld details, e.g. ssnb/ssmb. */
export function combinedDesignationWeldDetails(
  slices: ProcessSlice[],
): string {
  const codes = slices.map((s) => compactWeldDetailsCode(s.weld_details));
  return codes.length > 1 ? codes.join("/") : (codes[0] ?? "ssnb");
}

/** Designation position text — slashes become spaced ampersands. */
export function designationPositionText(positions: string): string {
  return positions.replace(/\//g, " & ");
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
  const approved = range?.approved_material_groups ?? [];
  if (
    approved.length === 11 &&
    approved.every((g, i) => g === String(i + 1))
  ) {
    return "1–11";
  }
  if (approved.length > 0) {
    return approved.map((g) => `${g} & ${g}.1`).join(", ");
  }
  if (!group) return "—";
  const major = group.split(".")[0];
  return `${major} & ${major}.1`;
}

export function positionsRangeText(positions: string[]): string {
  return positions.length ? positions.join(", ") : "—";
}

/** One welding process on a qualification (primary or second). */
export interface ProcessSlice {
  process: string;
  position: string | null;
  filler_group: string | null;
  filler_designation: string | null;
  filler_type: string | null;
  shielding_gas: string | null;
  current_polarity: string | null;
  transfer_mode: string | null;
  weld_details: string | null;
  layer_type: string | null;
  deposited_thickness_mm: number | null;
}


export { isMultiProcessQualification } from "@/lib/iso9606/constants";

/** Primary + optional second process slices from a WPQ row. */
export function getProcessSlices(wpq: QualificationRecord): ProcessSlice[] {
  const primary: ProcessSlice = {
    process: wpq.process,
    position: wpq.position,
    filler_group: wpq.filler_group,
    filler_designation: wpq.filler_designation,
    filler_type: wpq.filler_type,
    shielding_gas: wpq.shielding_gas,
    current_polarity: wpq.current_polarity,
    transfer_mode: wpq.transfer_mode,
    weld_details: wpq.weld_details,
    layer_type: wpq.layer_type,
    deposited_thickness_mm: wpq.deposited_thickness_mm,
  };
  if (!wpq.process_2) return [primary];
  return [
    primary,
    {
      process: wpq.process_2,
      position: wpq.position_2 ?? wpq.position,
      filler_group: wpq.process2_filler_group,
      filler_designation: wpq.process2_filler_designation,
      filler_type: wpq.process2_filler_type,
      shielding_gas: wpq.process2_shielding_gas,
      current_polarity: wpq.process2_current_polarity,
      transfer_mode: wpq.process2_transfer_mode,
      weld_details: wpq.process2_weld_details,
      layer_type: wpq.process2_layer_type,
      deposited_thickness_mm: wpq.process2_deposited_thickness_mm,
    },
  ];
}

export function processDisplayText(wpq: QualificationRecord): string {
  if (wpq.process_2) return `${wpq.process}+${wpq.process_2}`;
  return wpq.process;
}

export function processRangeDisplayText(wpq: QualificationRecord): string {
  if (wpq.process_2) {
    return `${processRangeText(wpq.process)}+${processRangeText(wpq.process_2)}`;
  }
  return processRangeText(wpq.process);
}

function formatTable6RangeText(
  s: number,
  process: string,
  layer: string | null,
): string {
  const res = computeTable6DepositedRange(s, { process, layer });
  if (res.unlimited) return formatMinMm(res.min);
  if (res.max != null) return `${res.min} – ${res.max} mm`;
  return formatMinMm(res.min);
}

/** Per-process Table 6 deposited-thickness range (multi-process certificates). */
export function perProcessDepositedRangeText(slice: ProcessSlice): string {
  const s = slice.deposited_thickness_mm;
  if (s == null || s <= 0) return "—";
  return formatTable6RangeText(s, slice.process, slice.layer_type);
}

/** Test piece column — fillet material thickness t (Table 8). */
export function formatMaterialThicknessTest(
  thickness: number | null | undefined,
  opts?: { process?: string | null },
): string {
  if (thickness == null) return "—";
  if (opts?.process) return `${thickness} (FW, ${opts.process})`;
  return `${thickness} (FW)`;
}

/** Test piece column — butt deposited thickness s (Table 6), with (BW) prefix. */
export function formatDepositedThicknessTest(slices: ProcessSlice[]): string {
  const parts = slices
    .map((s) => {
      const v = s.deposited_thickness_mm;
      if (v == null) return null;
      return `${v}(${s.process})`;
    })
    .filter(Boolean);
  if (!parts.length) return "—";
  return `(BW) ${parts.join(" & ")}`;
}

/** Test column: `3 (141) & 8 (111)` when two processes differ. */
export function formatPerProcessTestValues(
  slices: ProcessSlice[],
  value: (s: ProcessSlice) => string | null,
  fallback = "—",
): string {
  if (slices.length === 1) return value(slices[0]) ?? fallback;
  const parts = slices
    .map((s) => {
      const v = value(s);
      if (v == null || v === "—" || v === "NA") return null;
      return `${v} (${s.process})`;
    })
    .filter(Boolean);
  return parts.length ? parts.join(" & ") : fallback;
}

/** Test/range column with process prefix: `111: …` & `141: …`. */
export function formatPerProcessPrefixed(
  slices: ProcessSlice[],
  value: (s: ProcessSlice) => string,
): string {
  if (slices.length === 1) return value(slices[0]);
  return slices.map((s) => `${s.process}: ${value(s)}`).join(", ");
}

/** Range column for per-process deposited thickness. */
export function formatPerProcessDepositedRange(slices: ProcessSlice[]): string {
  if (slices.length === 1) return perProcessDepositedRangeText(slices[0]);
  return slices
    .map((s) => `${s.process}: ${perProcessDepositedRangeText(s)}`)
    .join("; ");
}

export function shieldingGasDisplay(stored: string | null | undefined): string {
  const n = normalizeShieldingGas(stored);
  return n || "—";
}

/** Compact per-process thickness for ID card: `3–16mm(111) & 3–6mm(141)`. */
export function formatIdCardPerProcessThickness(
  slices: ProcessSlice[],
): string {
  if (slices.length === 1) {
    return compactIdCardThickness(
      perProcessDepositedRangeText(slices[0]),
    );
  }
  return slices
    .map((s) => {
      const r = compactIdCardThickness(perProcessDepositedRangeText(s));
      return r === "—" ? null : `${r}(${s.process})`;
    })
    .filter(Boolean)
    .join(" & ");
}

function compactIdCardThickness(text: string): string {
  if (text === "—") return "—";
  return text.replace(/ mm/g, "mm").replace(/ – /g, "–").replace(/>= /g, "≥");
}
