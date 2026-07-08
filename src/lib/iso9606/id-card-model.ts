import type { QualificationRecord, RangeOfApproval, Welder } from "@/types/db";
import { daysUntil } from "@/lib/welder-status";
import { normalizePlantWelderId } from "@/lib/welders/plant-id";
import { BW_POSITIONS, FW_POSITIONS, WELDING_PROCESSES } from "./constants";
import { weldTypeCode } from "./ped-format";
import { resolveJointTypes } from "./joint-coverage";
import {
  fillerGroupRangeText,
  formatIdCardPerProcessThickness,
  formatThicknessRange,
  getProcessSlices,
  isMultiProcessQualification,
  processDisplayText,
} from "./certificate-ranges";
import { formatFilletMaterialRangeText } from "@/lib/range-engine/iso9606";
import { formatDate } from "@/lib/utils";
import rules from "@/lib/range-engine/iso9606.rules.json";

export interface IdCardQualRow {
  process: string;
  positionBw: string;
  positionFw: string;
  thicknessBw: string;
  thicknessFw: string;
  od: string;
  jointType: string;
  fmGroup: string;
  testDate: string;
  validUpto: string;
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

type RulesJson = typeof rules & {
  positionMapFw: Record<string, string[]>;
};

const r = rules as RulesJson;

export function processCompact(code: string): string {
  const p = WELDING_PROCESSES.find((x) => x.code === code);
  if (!p) return code;
  const short = p.name.split(/[\s(/]/)[0];
  return `${short}(${code})`;
}

function formatDiameter(
  range: RangeOfApproval | undefined,
  product: string,
): string {
  if (!range || range.pipe_od_min_mm == null) {
    return product === "Plate" ? "ALL" : "—";
  }
  if (product === "Plate" && range.pipe_od_unlimited) return "ALL";
  if (range.pipe_od_max_mm != null) {
    return `${range.pipe_od_min_mm}–${range.pipe_od_max_mm}mm`;
  }
  return `≥${range.pipe_od_min_mm}mm`;
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
  const mid = Math.ceil(ordered.length / 2);
  return `${ordered.slice(0, mid).join("/")}\n${ordered.slice(mid).join("/")}`;
}

function compactThickness(text: string): string {
  return text.replace(/ mm/g, "mm").replace(/ – /g, "–");
}

function toIdCardRow(
  q: QualificationRecord,
  range: RangeOfApproval | undefined,
): IdCardQualRow {
  const jointTypes = resolveJointTypes(q, range);
  const hasSuppFillet = q.joint_type === "BW" && q.supplementary_fillet;

  const bwPositions = range?.approved_positions?.length
    ? range.approved_positions
    : q.position
      ? [q.position]
      : [];

  const fwPositions =
    hasSuppFillet && q.supplementary_fillet_position
      ? (r.positionMapFw[q.supplementary_fillet_position] ?? [
          q.supplementary_fillet_position,
        ])
      : jointTypes.includes("FW") && q.joint_type === "FW"
        ? bwPositions
        : [];

  const thickBw = jointTypes.includes("BW")
    ? isMultiProcessQualification(q)
      ? formatIdCardPerProcessThickness(getProcessSlices(q))
      : compactThickness(formatThicknessRange(range ?? null))
    : "NA";

  let thickFw = "NA";
  if (hasSuppFillet) {
    thickFw = compactThickness(
      formatFilletMaterialRangeText(q.supplementary_fillet_thickness_mm),
    );
  } else if (jointTypes.includes("FW")) {
    thickFw = compactThickness(formatThicknessRange(range ?? null));
  }

  return {
    process: isMultiProcessQualification(q)
      ? processDisplayText(q)
      : processCompact(q.process),
    positionBw: formatPositionsSlash(bwPositions, "BW", jointTypes),
    positionFw: formatPositionsSlash(fwPositions, "FW", jointTypes),
    thicknessBw: thickBw,
    thicknessFw: thickFw,
    od: formatDiameter(range, q.product),
    jointType: weldTypeCode(jointTypes),
    fmGroup: fillerGroupRangeText(q.filler_group),
    testDate: formatDate(q.certificate_issued_date ?? q.date_of_welding),
    validUpto: formatDate(q.expiry_date),
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
  testDate: "—",
  validUpto: "—",
};

export function buildIdCardPayload(
  welder: Pick<Welder, "full_name" | "welder_id">,
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
    "—";

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
