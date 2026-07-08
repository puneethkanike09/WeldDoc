import type { SupabaseClient } from "@supabase/supabase-js";
import { processLabel } from "@/lib/iso9606/constants";
import type {
  QualificationRecord,
  RangeOfApproval,
  Welder,
} from "@/types/db";
import { isActiveRegistryStatus } from "@/lib/registry-status";

export interface MasterRow {
  welderName: string;
  welderId: string;
  process: string;
  standard: string;
  jointType: string;
  product: string;
  position: string;
  materialGroups: string;
  thicknessRange: string;
  pipeOdRange: string;
  status: string;
  isLegacy: boolean;
  issued: string;
  expiry: string;
  revalidation: string;
}

function thicknessText(r: RangeOfApproval | undefined): string {
  if (!r) return "—";
  if (r.thickness_unlimited && r.thickness_min_mm != null)
    return `≥ ${r.thickness_min_mm} mm`;
  if (r.thickness_min_mm != null && r.thickness_max_mm != null)
    return `${r.thickness_min_mm}–${r.thickness_max_mm} mm`;
  return "—";
}

function pipeText(r: RangeOfApproval | undefined): string {
  if (!r || r.pipe_od_min_mm == null) return "—";
  if (r.pipe_od_max_mm != null) {
    return `${r.pipe_od_min_mm}–${r.pipe_od_max_mm} mm`;
  }
  return r.pipe_od_unlimited
    ? `≥ ${r.pipe_od_min_mm} mm`
    : `≥ ${r.pipe_od_min_mm} mm`;
}

export async function getMasterListRows(
  supabase: SupabaseClient,
  orgId: string,
): Promise<MasterRow[]> {
  const [{ data: wpqRows }, { data: welderRows }] = await Promise.all([
    supabase
      .from("qualification_records")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    supabase.from("welders").select("*").eq("org_id", orgId),
  ]);

  const wpqs = (wpqRows ?? []) as QualificationRecord[];
  const welders = new Map(
    ((welderRows ?? []) as Welder[]).map((w) => [w.id, w]),
  );

  const { data: rangeRows } = await supabase
    .from("ranges_of_approval")
    .select("*")
    .in(
      "wpq_id",
      wpqs.length ? wpqs.map((w) => w.id) : ["00000000-0000-0000-0000-000000000000"],
    );
  const ranges = new Map(
    ((rangeRows ?? []) as RangeOfApproval[]).map((r) => [r.wpq_id, r]),
  );

  return wpqs.flatMap((q) => {
    const welder = welders.get(q.welder_id);
    if (!welder || !isActiveRegistryStatus(welder.status)) return [];

    const range = ranges.get(q.id);
    return [
      {
        welderName: welder.full_name,
        welderId: welder.welder_id ?? "—",
      process: processLabel(q.process),
      standard: "ISO 9606-1",
      jointType: q.joint_type,
      product: q.product,
      position: q.position ?? "—",
      materialGroups:
        range?.approved_material_groups?.join(", ") ??
        q.base_material_group ??
        "—",
      thicknessRange: thicknessText(range),
      pipeOdRange: pipeText(range),
      status: q.wpq_status,
      isLegacy: q.is_legacy,
      issued: q.certificate_issued_date ?? "—",
      expiry: q.expiry_date ?? "—",
      revalidation: q.revalidation_method,
      },
    ];
  });
}

export const MASTER_COLUMNS: { key: keyof MasterRow; label: string }[] = [
  { key: "welderName", label: "Welder" },
  { key: "welderId", label: "Welder ID" },
  { key: "process", label: "Process" },
  { key: "standard", label: "Standard" },
  { key: "jointType", label: "Joint" },
  { key: "product", label: "Product" },
  { key: "position", label: "Position" },
  { key: "materialGroups", label: "Material groups" },
  { key: "thicknessRange", label: "Thickness range" },
  { key: "pipeOdRange", label: "Pipe OD range" },
  { key: "status", label: "Status" },
  { key: "issued", label: "Issued" },
  { key: "expiry", label: "Expiry" },
  { key: "revalidation", label: "Reval." },
];
