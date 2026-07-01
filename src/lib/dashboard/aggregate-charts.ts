import { processLabel } from "@/lib/iso9606/constants";
import { displayJointType } from "@/lib/iso9606/product-dimensions";
import { processLabel as operatorProcessLabel } from "@/lib/iso14732/constants";
import type {
  OperatorQualification,
  QualificationRecord,
  RangeOfApproval,
} from "@/types/db";

export interface ChartSlice {
  name: string;
  value: number;
}

function increment(counts: Record<string, number>, key: string) {
  counts[key] = (counts[key] ?? 0) + 1;
}

function toSlices(
  counts: Record<string, number>,
  sort: "value" | "label" = "value",
): ChartSlice[] {
  const entries = Object.entries(counts).filter(([, value]) => value > 0);
  if (sort === "label") {
    entries.sort(([a], [b]) => a.localeCompare(b));
  } else {
    entries.sort(([, a], [, b]) => b - a);
  }
  return entries.map(([name, value]) => ({ name, value }));
}

function thicknessBucket(
  wpq: QualificationRecord,
  range?: RangeOfApproval,
): string {
  if (range?.thickness_unlimited) return "Unlimited";
  const mm = wpq.test_thickness_mm ?? range?.thickness_min_mm;
  if (mm == null) return "Not specified";
  if (mm < 3) return "< 3 mm";
  if (mm < 12) return "3–12 mm";
  if (mm < 40) return "12–40 mm";
  return "≥ 40 mm";
}

const THICKNESS_ORDER = [
  "< 3 mm",
  "3–12 mm",
  "12–40 mm",
  "≥ 40 mm",
  "Unlimited",
  "Not specified",
];

function diameterBucket(
  wpq: QualificationRecord,
  range?: RangeOfApproval,
): string {
  if (wpq.product === "Plate") return "Plate (N/A)";
  if (range?.pipe_od_unlimited) return "Unlimited";
  const mm =
    wpq.pipe_od_mm ??
    wpq.dimension2_pipe_od_mm ??
    range?.pipe_od_min_mm;
  if (mm == null) return "Not specified";
  if (mm < 25) return "< 25 mm OD";
  if (mm < 150) return "25–150 mm OD";
  if (mm < 400) return "150–400 mm OD";
  return "≥ 400 mm OD";
}

const DIAMETER_ORDER = [
  "< 25 mm OD",
  "25–150 mm OD",
  "150–400 mm OD",
  "≥ 400 mm OD",
  "Unlimited",
  "Not specified",
  "Plate (N/A)",
];

function orderedSlices(
  counts: Record<string, number>,
  order: string[],
): ChartSlice[] {
  const extra = Object.keys(counts).filter((k) => !order.includes(k));
  return [...order, ...extra.sort()]
    .map((name) => ({ name, value: counts[name] ?? 0 }))
    .filter((s) => s.value > 0);
}

function fmGroupLabel(wpq: QualificationRecord): string {
  if (wpq.filler_group?.trim()) return wpq.filler_group.trim();
  if (wpq.base_material_group?.trim()) {
    return `Group ${wpq.base_material_group.trim()}`;
  }
  return "Not specified";
}

function jointLabel(wpq: QualificationRecord): string {
  const raw = displayJointType(wpq);
  if (raw === "BW") return "Butt weld (BW)";
  if (raw === "FW") return "Fillet weld (FW)";
  return raw;
}

export function aggregateWelderMasterCharts(
  approved: QualificationRecord[],
  ranges: Map<string, RangeOfApproval>,
) {
  const byProcess: Record<string, number> = {};
  const byPosition: Record<string, number> = {};
  const byFmGroup: Record<string, number> = {};
  const byProduct: Record<string, number> = {};
  const byJoint: Record<string, number> = {};
  const byThickness: Record<string, number> = {};
  const byDiameter: Record<string, number> = {};

  for (const wpq of approved) {
    const range = ranges.get(wpq.id);
    increment(byProcess, processLabel(wpq.process));
    increment(byPosition, wpq.position?.trim() || "Not specified");
    increment(byFmGroup, fmGroupLabel(wpq));
    increment(byProduct, wpq.product);
    increment(byJoint, jointLabel(wpq));
    increment(byThickness, thicknessBucket(wpq, range));
    increment(byDiameter, diameterBucket(wpq, range));
  }

  return {
    byProcess: toSlices(byProcess),
    byPosition: toSlices(byPosition, "label"),
    byFmGroup: toSlices(byFmGroup),
    byProduct: toSlices(byProduct, "label"),
    byJoint: toSlices(byJoint),
    byThickness: orderedSlices(byThickness, THICKNESS_ORDER),
    byDiameter: orderedSlices(byDiameter, DIAMETER_ORDER),
  };
}

export function aggregateOperatorMasterCharts(approved: OperatorQualification[]) {
  const byProcess: Record<string, number> = {};
  const byProduct: Record<string, number> = {};
  const byJoint: Record<string, number> = {};
  const byWeldingType: Record<string, number> = {};

  for (const oq of approved) {
    increment(byProcess, operatorProcessLabel(oq.process));
    increment(byProduct, oq.product_type?.trim() || "Not specified");
    increment(byJoint, oq.joint_type?.trim() || "Not specified");
    increment(byWeldingType, oq.welding_type ?? "Not specified");
  }

  return {
    byProcess: toSlices(byProcess),
    byProduct: toSlices(byProduct, "label"),
    byJoint: toSlices(byJoint, "label"),
    byWeldingType: toSlices(byWeldingType, "label"),
  };
}
