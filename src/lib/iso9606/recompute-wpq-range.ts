import type { SupabaseClient } from "@supabase/supabase-js";
import { computeRange } from "@/lib/range-engine/iso9606";
import { branchPipeOdForRange } from "@/lib/iso9606/branch-deposited-thickness";
import { hasAnySupplementaryFillet } from "@/lib/iso9606/supplementary-fillet";
import { ndtJointCategory } from "@/lib/iso9606/qualification-fields";
import { createClient } from "@/lib/supabase/server";
import type { QualificationRecord } from "@/types/db";

type RangePayload = {
  wpq_id: string;
  thickness_min_mm: number | null;
  thickness_max_mm: number | null;
  thickness_unlimited: boolean;
  pipe_od_min_mm: number | null;
  pipe_od_max_mm?: number | null;
  pipe_od_unlimited: boolean;
  approved_positions: string[];
  approved_material_groups: string[];
  approved_joint_types: string[];
  summary: string;
};

async function upsertRangeOfApproval(
  supabase: SupabaseClient,
  payload: RangePayload,
) {
  const { error } = await supabase
    .from("ranges_of_approval")
    .upsert(payload, { onConflict: "wpq_id" });

  if (
    error?.message?.includes("pipe_od_max_mm") &&
    "pipe_od_max_mm" in payload
  ) {
    const { pipe_od_max_mm: _drop, ...legacy } = payload;
    const retry = await supabase
      .from("ranges_of_approval")
      .upsert(legacy, { onConflict: "wpq_id" });
    if (retry.error) {
      throw new Error(
        `Failed to save range of approval: ${retry.error.message}. Run database migrations (npm run db:migrate).`,
      );
    }
    return;
  }

  if (error) {
    throw new Error(`Failed to save range of approval: ${error.message}`);
  }
}

export async function recomputeWpqRange(
  wpqId: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient ?? (await createClient());
  const { data } = await supabase
    .from("qualification_records")
    .select("*")
    .eq("id", wpqId)
    .single();
  if (!data) return;
  const q = data as QualificationRecord;

  const range = computeRange({
    jointType: ndtJointCategory(q.joint_type),
    product: q.product === "Branch" ? "Pipe" : q.product,
    testThicknessMm: q.test_thickness_mm,
    depositedThicknessMm: q.deposited_thickness_mm,
    process: q.process,
    layer: q.layer_type,
    pipeOdMm: branchPipeOdForRange(q),
    position: q.position,
    materialGroup: q.base_material_group,
    fillerGroup: q.filler_group,
    fillerType: q.filler_type,
    supplementaryFillet: hasAnySupplementaryFillet(q),
    jointTypeExtended: q.joint_type_extended,
    secondProcess: q.process_2
      ? {
          process: q.process_2,
          depositedThicknessMm: q.process2_deposited_thickness_mm,
          layer: q.process2_layer_type,
          position: q.position_2,
        }
      : null,
  });

  await upsertRangeOfApproval(supabase, {
    wpq_id: wpqId,
    thickness_min_mm: range.thicknessMin,
    thickness_max_mm: range.thicknessMax,
    thickness_unlimited: range.thicknessUnlimited,
    pipe_od_min_mm: range.pipeOdMin,
    pipe_od_max_mm: range.pipeOdMax,
    pipe_od_unlimited: range.pipeOdUnlimited,
    approved_positions: range.approvedPositions,
    approved_material_groups: range.approvedMaterialGroups,
    approved_joint_types: range.approvedJointTypes,
    summary: range.summary,
  });
}
