import type { SupabaseClient } from "@supabase/supabase-js";
import { BW_POSITIONS, FW_POSITIONS } from "@/lib/iso9606/constants";
import { weldTypeCode } from "@/lib/iso9606/ped-format";
import { normalizePlantWelderId } from "@/lib/welders/plant-id";
import type {
  QualificationRecord,
  QualificationTestReport,
  RangeOfApproval,
  Welder,
} from "@/types/db";

export interface PedMasterRow {
  slNo: number;
  welderName: string;
  site: string;
  welderNo: string;
  process: string;
  jointType: string;
  positionBw: string;
  positionFw: string;
  fmGroup: string;
  diameter: string;
  bwThickness: string;
  fwThickness: string;
  testDate: string;
  validUntil: string;
}

export const PED_MASTER_COLUMNS: { key: keyof PedMasterRow; label: string }[] =
  [
    { key: "slNo", label: "SL. NO." },
    { key: "welderName", label: "WELDER NAME" },
    { key: "site", label: "SITE" },
    { key: "welderNo", label: "WELDER NO" },
    { key: "process", label: "PROCESS" },
    { key: "jointType", label: "JOINT TYPE" },
    { key: "positionBw", label: "BW" },
    { key: "positionFw", label: "FW" },
    { key: "fmGroup", label: "FM GROUP" },
    { key: "diameter", label: "Dia." },
    { key: "bwThickness", label: "(BW) Thk" },
    { key: "fwThickness", label: "(FW) Thk" },
    { key: "testDate", label: "TEST DATE" },
    { key: "validUntil", label: "VALID UP TO" },
  ];

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

export function formatPedDate(value: string | null | undefined): string {
  if (!value || value === "—") return "—";
  const d = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = String(d.getDate()).padStart(2, "0");
  const mon = months[d.getMonth()];
  const yr = String(d.getFullYear()).slice(-2);
  return `${day}-${mon}-${yr}`;
}

function layerIsSingle(layer: string | null): boolean {
  if (!layer) return true;
  return /single|^sl$/i.test(layer);
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
    return `${trimMm(range.thickness_min_mm)}mm to ${trimMm(range.thickness_max_mm)}mm`;
  }
  return `≥${trimMm(range.thickness_min_mm)}mm`;
}

function trimMm(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
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
    return `${trimMm(range.pipe_od_min_mm)}–${trimMm(range.pipe_od_max_mm)}mm`;
  }
  if (range.pipe_od_unlimited) return `≥${trimMm(range.pipe_od_min_mm)}mm`;
  return `≥${trimMm(range.pipe_od_min_mm)}mm`;
}

function formatPositions(
  positions: string[] | undefined,
  kind: "BW" | "FW",
  jointTypes: string[],
): string {
  const hasJoint =
    kind === "BW"
      ? jointTypes.includes("BW")
      : jointTypes.includes("FW");
  if (!hasJoint) return "NA";
  const allowed = kind === "BW" ? BW_SET : FW_SET;
  const list = (positions ?? []).filter((p) => allowed.has(p));
  if (!list.length) return "NA";
  const ordered = POS_ORDER.filter((p) => list.includes(p));
  return ordered.join(", ");
}

function resolveJointTypes(
  q: QualificationRecord,
  range: RangeOfApproval | undefined,
): string[] {
  if (range?.approved_joint_types?.length) return range.approved_joint_types;
  if (q.joint_type === "BW" && q.supplementary_fillet) return ["BW", "FW"];
  return [q.joint_type];
}

function resolveSite(
  welder: Welder | undefined,
  orgLocationCode: string | null,
): string {
  const branch = welder?.branch_location?.trim();
  if (branch) return branch.length <= 3 ? branch.toUpperCase() : branch.slice(0, 1).toUpperCase();
  if (orgLocationCode) return orgLocationCode.toUpperCase();
  return "—";
}

function resolveWelderNo(welder: Welder | undefined): string {
  if (!welder?.welder_id) return "—";
  return normalizePlantWelderId(welder.welder_id) ?? welder.welder_id.trim();
}

export function toPedMasterRow(
  q: QualificationRecord,
  welder: Welder | undefined,
  range: RangeOfApproval | undefined,
  report: QualificationTestReport | undefined,
  orgLocationCode: string | null,
  slNo: number,
): PedMasterRow {
  const jointTypes = resolveJointTypes(q, range);
  const jointType = weldTypeCode(jointTypes);
  const positions = range?.approved_positions?.length
    ? range.approved_positions
    : q.position
      ? [q.position]
      : [];

  const bwThickness =
    jointTypes.includes("BW")
      ? formatThickness(range, q.layer_type)
      : "NA";
  const fwThickness =
    jointTypes.includes("FW")
      ? formatThickness(range, q.layer_type)
      : "NA";

  const testDate =
    report?.test_date ??
    q.date_of_welding ??
    q.certificate_issued_date ??
    null;

  return {
    slNo,
    welderName: welder?.full_name ?? "—",
    site: resolveSite(welder, orgLocationCode),
    welderNo: resolveWelderNo(welder),
    process: q.process,
    jointType,
    positionBw: formatPositions(positions, "BW", jointTypes),
    positionFw: formatPositions(positions, "FW", jointTypes),
    fmGroup: q.filler_group ?? "—",
    diameter: formatDiameter(range, q.product),
    bwThickness,
    fwThickness,
    testDate: formatPedDate(testDate),
    validUntil: formatPedDate(q.expiry_date),
  };
}

export async function getPedMasterListRows(
  supabase: SupabaseClient,
  orgId: string,
): Promise<PedMasterRow[]> {
  const [{ data: wpqRows }, { data: welderRows }, { data: org }] =
    await Promise.all([
      supabase
        .from("qualification_records")
        .select("*")
        .eq("org_id", orgId)
        .eq("wpq_status", "Approved")
        .order("created_at", { ascending: true }),
      supabase.from("welders").select("*").eq("org_id", orgId),
      supabase
        .from("organizations")
        .select("location_code")
        .eq("id", orgId)
        .single(),
    ]);

  const wpqs = (wpqRows ?? []) as QualificationRecord[];
  const welders = new Map(
    ((welderRows ?? []) as Welder[]).map((w) => [w.id, w]),
  );

  const reportIds = [
    ...new Set(wpqs.map((q) => q.report_id).filter(Boolean) as string[]),
  ];
  const wpqIds = wpqs.map((q) => q.id);

  const [{ data: rangeRows }, { data: reportRows }] = await Promise.all([
    supabase
      .from("ranges_of_approval")
      .select("*")
      .in(
        "wpq_id",
        wpqIds.length ? wpqIds : ["00000000-0000-0000-0000-000000000000"],
      ),
    reportIds.length
      ? supabase
          .from("qualification_test_reports")
          .select("*")
          .in("id", reportIds)
      : Promise.resolve({ data: [] }),
  ]);

  const ranges = new Map(
    ((rangeRows ?? []) as RangeOfApproval[]).map((r) => [r.wpq_id, r]),
  );
  const reports = new Map(
    ((reportRows ?? []) as QualificationTestReport[]).map((r) => [r.id, r]),
  );

  const sorted = [...wpqs].sort((a, b) => {
    const nameA = welders.get(a.welder_id)?.full_name ?? "";
    const nameB = welders.get(b.welder_id)?.full_name ?? "";
    const byName = nameA.localeCompare(nameB);
    if (byName !== 0) return byName;
    return a.process.localeCompare(b.process);
  });

  const slByWelder = new Map<string, number>();
  let nextSl = 0;

  return sorted.map((q) => {
    if (!slByWelder.has(q.welder_id)) {
      nextSl += 1;
      slByWelder.set(q.welder_id, nextSl);
    }
    const welder = welders.get(q.welder_id);
    const range = ranges.get(q.id);
    const report = q.report_id ? reports.get(q.report_id) : undefined;
    return toPedMasterRow(
      q,
      welder,
      range,
      report,
      org?.location_code ?? null,
      slByWelder.get(q.welder_id)!,
    );
  });
}
