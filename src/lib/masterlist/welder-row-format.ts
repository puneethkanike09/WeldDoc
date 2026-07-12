import type { QualificationRecord, RangeOfApproval } from "@/types/db";
import { continuityDue } from "@/lib/expiry";
import {
  BW_POSITIONS,
  FW_POSITIONS,
  isMultiProcessQualification,
  processLabel,
} from "@/lib/iso9606/constants";
import {
  fillerGroupRangeText,
  formatIdCardPerProcessThickness,
  formatThicknessRange,
  getProcessSlices,
} from "@/lib/iso9606/certificate-ranges";
import { effectiveRangeForWpq } from "@/lib/iso9606/effective-range";
import { resolveJointTypes } from "@/lib/iso9606/joint-coverage";
import { weldTypeCode } from "@/lib/iso9606/ped-format";
import { listSupplementaryFilletEntries } from "@/lib/iso9606/supplementary-fillet";
import { formatFilletMaterialRangeText } from "@/lib/range-engine/iso9606";
import rules from "@/lib/range-engine/iso9606.rules.json";

type RulesJson = typeof rules & {
  positionMapFw: Record<string, string[]>;
};

const r = rules as RulesJson;

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

export interface WelderMasterListFields {
  welderName: string;
  welderNo: string;
  process: string;
  jointType: string;
  actualBwPosition: string;
  actualFwPosition: string;
  qualifiedBwPosition: string;
  qualifiedFwPosition: string;
  fmGroup: string;
  qualifiedDia: string;
  qualifiedBwThk: string;
  qualifiedFwThk: string;
  testDate: string | null;
  continuityExpiry: string | null;
  revalidationExpiry: string | null;
  status: string;
  revalidationMethod: string;
  isLegacy: boolean;
}

function compactThickness(text: string): string {
  return text.replace(/ mm/g, "mm").replace(/ – /g, "–");
}

function formatDiameter(
  range: RangeOfApproval | null,
  product: string,
): string {
  if (!range || range.pipe_od_min_mm == null) {
    return product === "Plate" ? "ALL" : "—";
  }
  if (product === "Plate" && range.pipe_od_unlimited) return "ALL";
  if (range.pipe_od_max_mm != null) {
    return `${range.pipe_od_min_mm}–${range.pipe_od_max_mm}mm`;
  }
  return `>=${range.pipe_od_min_mm}mm`;
}

function formatPositionsList(
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
  return POS_ORDER.filter((p) => list.includes(p)).join("/");
}

function masterProcessLabel(q: QualificationRecord): string {
  if (isMultiProcessQualification(q)) {
    return `${processLabel(q.process)} + ${processLabel(q.process_2!)}`;
  }
  return processLabel(q.process);
}

function actualBwPosition(
  q: QualificationRecord,
  jointTypes: string[],
): string {
  if (!jointTypes.includes("BW")) return "NA";
  if (q.joint_type === "BW") return q.position ?? "—";
  return q.position ?? "—";
}

function actualFwPosition(q: QualificationRecord): string {
  if (q.joint_type === "FW") return q.position ?? "—";
  const supp = listSupplementaryFilletEntries(q);
  if (supp.length) return supp.map((e) => e.position).join(" / ");
  return "NA";
}

export function buildWelderMasterListFields(
  q: QualificationRecord,
  storedRange: RangeOfApproval | null | undefined,
): WelderMasterListFields {
  const range = effectiveRangeForWpq(q, storedRange ?? null);
  const jointTypes = resolveJointTypes(q, range);
  const suppEntries = listSupplementaryFilletEntries(q);
  const hasSuppFillet = suppEntries.length > 0;

  const qualifiedBwPositions = range.approved_positions?.length
    ? range.approved_positions
    : q.position
      ? [q.position]
      : [];

  const qualifiedFwPositions = hasSuppFillet
    ? [
        ...new Set(
          suppEntries.flatMap(
            (e) => r.positionMapFw[e.position] ?? [e.position],
          ),
        ),
      ]
    : jointTypes.includes("FW") && q.joint_type === "FW"
      ? qualifiedBwPositions
      : [];

  let qualifiedBwThk = "NA";
  if (jointTypes.includes("BW")) {
    qualifiedBwThk = isMultiProcessQualification(q)
      ? formatIdCardPerProcessThickness(getProcessSlices(q))
      : compactThickness(formatThicknessRange(range));
  }

  let qualifiedFwThk = "NA";
  if (hasSuppFillet) {
    qualifiedFwThk = suppEntries
      .map((e) =>
        compactThickness(formatFilletMaterialRangeText(e.thickness_mm)),
      )
      .join(" / ");
  } else if (jointTypes.includes("FW")) {
    qualifiedFwThk = compactThickness(formatThicknessRange(range));
  }

  return {
    welderName: "",
    welderNo: "",
    process: masterProcessLabel(q),
    jointType: weldTypeCode(jointTypes),
    actualBwPosition: actualBwPosition(q, jointTypes),
    actualFwPosition: actualFwPosition(q),
    qualifiedBwPosition: formatPositionsList(
      qualifiedBwPositions,
      "BW",
      jointTypes,
    ),
    qualifiedFwPosition: formatPositionsList(
      qualifiedFwPositions,
      "FW",
      jointTypes,
    ),
    fmGroup: q.filler_group ?? fillerGroupRangeText(q.filler_group),
    qualifiedDia: formatDiameter(range, q.product),
    qualifiedBwThk,
    qualifiedFwThk,
    testDate: q.date_of_welding,
    continuityExpiry: continuityDue(q.continuity_last_verified),
    revalidationExpiry: q.expiry_date,
    status: q.wpq_status,
    revalidationMethod: q.revalidation_method,
    isLegacy: q.is_legacy,
  };
}