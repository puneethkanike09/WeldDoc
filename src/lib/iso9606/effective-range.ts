/**
 * Resolve range of approval for display — always derived from stored WPQ test data
 * so certificates stay correct even if the ranges_of_approval row is missing or stale.
 */

import { computeRange, type RangeResult } from "@/lib/range-engine/iso9606";
import { branchPipeOdForRange } from "@/lib/iso9606/branch-deposited-thickness";
import { ndtJointCategory } from "@/lib/iso9606/qualification-fields";
import type { QualificationRecord, RangeOfApproval } from "@/types/db";

function rangeFromComputed(
  wpqId: string,
  stored: RangeOfApproval | null,
  computed: RangeResult,
): RangeOfApproval {
  return {
    id: stored?.id ?? "",
    wpq_id: wpqId,
    thickness_min_mm: computed.thicknessMin,
    thickness_max_mm: computed.thicknessMax,
    thickness_unlimited: computed.thicknessUnlimited,
    pipe_od_min_mm: computed.pipeOdMin,
    pipe_od_max_mm: computed.pipeOdMax,
    pipe_od_unlimited: computed.pipeOdUnlimited,
    approved_positions: computed.approvedPositions,
    approved_material_groups: computed.approvedMaterialGroups,
    approved_joint_types: computed.approvedJointTypes,
    summary: computed.summary,
    created_at: stored?.created_at ?? new Date().toISOString(),
  };
}

/** Compute ISO 9606-1 ranges from the WPQ record (same inputs as server recompute). */
export function effectiveRangeForWpq(
  wpq: QualificationRecord,
  stored: RangeOfApproval | null = null,
): RangeOfApproval {
  const computed = computeRange({
    jointType: ndtJointCategory(wpq.joint_type),
    product: wpq.product === "Branch" ? "Pipe" : wpq.product,
    testThicknessMm: wpq.test_thickness_mm,
    depositedThicknessMm: wpq.deposited_thickness_mm,
    process: wpq.process,
    layer: wpq.layer_type,
    pipeOdMm: branchPipeOdForRange(wpq),
    position: wpq.position,
    materialGroup: wpq.base_material_group,
    fillerGroup: wpq.filler_group,
    fillerType: wpq.filler_type,
    supplementaryFillet: wpq.supplementary_fillet,
    jointTypeExtended: wpq.joint_type_extended,
    secondProcess: wpq.process_2
      ? {
          process: wpq.process_2,
          depositedThicknessMm: wpq.process2_deposited_thickness_mm,
          layer: wpq.process2_layer_type,
        }
      : null,
  });
  return rangeFromComputed(wpq.id, stored, computed);
}
