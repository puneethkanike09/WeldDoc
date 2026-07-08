import type { QualificationRecord, RangeOfApproval } from "@/types/db";
import { hasAnySupplementaryFillet } from "@/lib/iso9606/supplementary-fillet";

/** Approved joint types for certificate / designation. */
export function resolveJointTypes(
  q: Pick<
    QualificationRecord,
    "joint_type" | "supplementary_fillet" | "supplementary_fillet_2"
  >,
  range?: Pick<RangeOfApproval, "approved_joint_types"> | null,
): string[] {
  if (range?.approved_joint_types?.length) {
    return range.approved_joint_types;
  }
  if (q.joint_type === "FW") return ["FW"];
  if (hasAnySupplementaryFillet(q)) return ["BW", "FW"];
  return ["BW"];
}
