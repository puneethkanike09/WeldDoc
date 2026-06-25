import type { QualificationRecord, RangeOfApproval } from "@/types/db";

/** Approved joint types for certificate / designation. */
export function resolveJointTypes(
  q: Pick<QualificationRecord, "joint_type" | "supplementary_fillet">,
  range?: Pick<RangeOfApproval, "approved_joint_types"> | null,
): string[] {
  if (range?.approved_joint_types?.length) {
    return range.approved_joint_types;
  }
  if (q.joint_type === "FW") return ["FW"];
  if (q.supplementary_fillet) return ["BW", "FW"];
  return ["BW"];
}
