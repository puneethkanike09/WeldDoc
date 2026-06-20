import type { QualificationRecord, RangeOfApproval, Welder } from "@/types/db";
import { daysUntil } from "@/lib/welder-status";
import { normalizePlantWelderId } from "@/lib/welders/plant-id";
import { BW_POSITIONS, FW_POSITIONS, WELDING_PROCESSES } from "./constants";
import { weldTypeCode } from "./ped-format";

export interface IdCardQualRow {
  process: string;
  positionBw: string;
  positionFw: string;
  thicknessBw: string;
  thicknessFw: string;
  od: string;
  jointType: string;
  fmGroup: string;
}

export interface IdCardPayload {
  welderName: string;
  welderNo: string;
  rows: IdCardQualRow[];
}

const BW_SET = new Set<string>(BW_POSITIONS);
const FW_SET = new Set<string>(FW_POSITIONS);
const POS_ORDER = [
  "PA",
  "PB",
  "PC",
  "PD",
  "PE",
  "PF",
  "PG",
  "PH",
  "PJ",
  "H-L045",
  "J-L045",
];

export function processCompact(code: string): string {
  const p = WELDING_PROCESSES.find((x) => x.code === code);
  if (!p) return code;
  const short = p.name.split(/[\s(/]/)[0];
  return `${short}(${code})`;
}

function layerIsSingle(layer: string | null): boolean {
  if (!layer) return true;
  return /single|^sl$/i.test(layer);
}

function trimMm(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
}

function formatThickness(
  range: RangeOfApproval | undefined,
  layer: string | null,
): string {
  if (layerIsSingle(layer)) return "SL";
  if (!range || range.thickness_min_mm == null) return "—";
  if (range.thickness_unlimited) {
    return `≥${trimMm(range.thickness_min_mm)}mm`;
  }
  if (range.thickness_max_mm != null) {
    return `${trimMm(range.thickness_min_mm)}–${trimMm(range.thickness_max_mm)}mm`;
  }
  return `≥${trimMm(range.thickness_min_mm)}mm`;
}

function formatDiameter(
  range: RangeOfApproval | undefined,
  product: string,
): string {
  if (!range || range.pipe_od_min_mm == null) {
    return product === "Plate" ? "ALL" : "—";
  }
  if (product === "Plate" && range.pipe_od_unlimited) return "ALL";
  return `≥${trimMm(range.pipe_od_min_mm)}mm`;
}

function formatPositionsSlash(
  positions: string[] | undefined,
  kind: "BW" | "FW",
  jointTypes: string[],
): string {
  const hasJoint =
    kind === "BW" ? jointTypes.includes("BW") : jointTypes.includes("FW");
  if (!hasJoint) return "NA";
  const allowed = kind === "BW" ? BW_SET : FW_SET;
  const list = (positions ?? []).filter((p) => allowed.has(p));
  if (!list.length) return "NA";
  const ordered = POS_ORDER.filter((p) => list.includes(p));
  if (ordered.length <= 3) return ordered.join("/");
  // Wrap long position lists onto two lines for narrow ID-card cells.
  const mid = Math.ceil(ordered.length / 2);
  return `${ordered.slice(0, mid).join("/")}\n${ordered.slice(mid).join("/")}`;
}

function resolveJointTypes(
  q: QualificationRecord,
  range: RangeOfApproval | undefined,
): string[] {
  if (range?.approved_joint_types?.length) return range.approved_joint_types;
  if (q.joint_type === "BW" && q.supplementary_fillet) return ["BW", "FW"];
  return [q.joint_type];
}

function fmGroupText(
  q: QualificationRecord,
  range: RangeOfApproval | undefined,
): string {
  if (range?.approved_material_groups?.length) {
    return range.approved_material_groups
      .map((g) => (g.startsWith("FM") ? g : `FM${g}`))
      .join(", ");
  }
  const group = q.filler_group;
  if (!group) return "—";
  if (group === "FM1") return "FM1, FM2";
  return group;
}

function toIdCardRow(
  q: QualificationRecord,
  range: RangeOfApproval | undefined,
): IdCardQualRow {
  const jointTypes = resolveJointTypes(q, range);
  const positions = range?.approved_positions?.length
    ? range.approved_positions
    : q.position
      ? [q.position]
      : [];

  return {
    process: processCompact(q.process),
    positionBw: formatPositionsSlash(positions, "BW", jointTypes),
    positionFw: formatPositionsSlash(positions, "FW", jointTypes),
    thicknessBw: jointTypes.includes("BW")
      ? formatThickness(range, q.layer_type)
      : "NA",
    thicknessFw: jointTypes.includes("FW")
      ? formatThickness(range, q.layer_type)
      : "NA",
    od: formatDiameter(range, q.product),
    jointType: weldTypeCode(jointTypes),
    fmGroup: fmGroupText(q, range),
  };
}

const EMPTY_ROW: IdCardQualRow = {
  process: "—",
  positionBw: "—",
  positionFw: "—",
  thicknessBw: "—",
  thicknessFw: "—",
  od: "—",
  jointType: "—",
  fmGroup: "—",
};

export function buildIdCardPayload(
  welder: Pick<Welder, "full_name" | "welder_id" | "uid">,
  wpqs: QualificationRecord[],
  ranges: Map<string, RangeOfApproval>,
): IdCardPayload {
  const live = wpqs
    .filter((q) => q.wpq_status === "Approved")
    .filter((q) => {
      const d = daysUntil(q.expiry_date);
      return d === null || d >= 0;
    })
    .sort(
      (a, b) =>
        new Date(b.certificate_issued_date ?? b.created_at).getTime() -
        new Date(a.certificate_issued_date ?? a.created_at).getTime(),
    );

  const welderNo =
    normalizePlantWelderId(welder.welder_id) ??
    welder.welder_id?.trim() ??
    welder.uid;

  const rows =
    live.length > 0
      ? live.map((q) => toIdCardRow(q, ranges.get(q.id)))
      : [EMPTY_ROW];

  return {
    welderName: welder.full_name,
    welderNo,
    rows,
  };
}
