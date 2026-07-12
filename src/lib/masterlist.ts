import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  QualificationRecord,
  RangeOfApproval,
  Welder,
} from "@/types/db";
import { isActiveRegistryStatus } from "@/lib/registry-status";
import { isActiveQualification } from "@/lib/qualification-active";
import {
  buildWelderMasterListFields,
  type WelderMasterListFields,
} from "@/lib/masterlist/welder-row-format";
import { formatDate } from "@/lib/utils";

export {
  MASTER_EXPORT_COLUMNS,
  type MasterExportKey,
  orderedWelderMasterListColumns,
  welderMasterListColumnDefs,
  orderedMasterListColumns,
  masterListColumnDefs,
} from "@/lib/masterlist/columns";

import type { MasterExportKey } from "@/lib/masterlist/columns";

export interface MasterRow extends WelderMasterListFields {
  welderName: string;
  welderNo: string;
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
    if (!isActiveQualification(q)) return [];

    const fields = buildWelderMasterListFields(q, ranges.get(q.id));
    return [
      {
        ...fields,
        welderName: welder.full_name,
        welderNo: welder.welder_id ?? "—",
      },
    ];
  });
}

export function formatMasterRowExport(
  key: MasterExportKey,
  row: MasterRow,
  slNo: number,
): string {
  if (key === "slNo") return String(slNo);
  if (
    key === "testDate" ||
    key === "continuityExpiry" ||
    key === "revalidationExpiry"
  ) {
    return formatDate(row[key]);
  }
  if (key === "status") return row.status.replace("_", " ");
  return String(row[key] ?? "");
}
