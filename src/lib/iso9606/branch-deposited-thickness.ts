import type { QualificationRecord } from "@/types/db";

/** Pipe + Branch joint (ISO 9606-1 Fig. 1). */
export function isBranchQualification(
  wpq: Pick<QualificationRecord, "product" | "joint_type_extended">,
): boolean {
  return wpq.joint_type_extended === "Branch" || wpq.product === "Branch";
}

export function branchDepositedThicknessLabel(
  wpq: Pick<
    QualificationRecord,
    "joint_type_extended" | "product" | "branch_connection"
  >,
): string {
  if (!isBranchQualification(wpq)) return "Deposited thickness (mm)";
  if (wpq.branch_connection === "set_on") {
    return "Deposited thickness — branch weld (Fig. 1a) (mm)";
  }
  if (
    wpq.branch_connection === "set_in" ||
    wpq.branch_connection === "set_through"
  ) {
    return "Deposited thickness — main pipe (Fig. 1b/c) (mm)";
  }
  return "Deposited thickness (mm)";
}

export function branchDepositedThicknessTest(
  wpq: Pick<
    QualificationRecord,
    "deposited_thickness_mm" | "joint_type_extended" | "product"
  >,
): string {
  const s = wpq.deposited_thickness_mm;
  return s != null ? String(s) : "—";
}

export function branchPipeOdTestMm(
  wpq: Pick<
    QualificationRecord,
    "pipe_od_mm" | "dimension2_pipe_od_mm" | "joint_type_extended" | "product"
  >,
): number | null {
  if (!isBranchQualification(wpq)) return wpq.pipe_od_mm;
  return wpq.dimension2_pipe_od_mm ?? wpq.pipe_od_mm;
}

export function branchPipeOdForRange(
  wpq: Pick<
    QualificationRecord,
    "pipe_od_mm" | "dimension2_pipe_od_mm" | "joint_type_extended" | "product"
  >,
): number | null {
  return branchPipeOdTestMm(wpq);
}
