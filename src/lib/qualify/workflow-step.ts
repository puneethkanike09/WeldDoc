import type {
  NdtDtRecord,
  OperatorNdtRecord,
  OperatorQualification,
  QualificationRecord,
} from "@/types/db";

/** Furthest wizard step the user has already completed for this qualification. */
export function operatorQualifyMaxStep(
  oq: OperatorQualification | null,
  ndt: OperatorNdtRecord[],
): number {
  if (!oq) return 1;

  let max = 2;

  const testPieceSaved = Boolean(
    oq.equipment_power_source?.trim() ||
      oq.test_piece_dimensions_info?.trim() ||
      oq.material_spec_info?.trim(),
  );
  if (testPieceSaved) max = 3;

  const ndtSaved = Boolean(
    oq.qualification_test_method ||
      ndt.length > 0 ||
      oq.oq_status === "Pending_NDT" ||
      oq.oq_status === "Approved" ||
      oq.oq_status === "Failed",
  );
  if (ndtSaved) max = 4;

  return max;
}

export function welderQualifyMaxStep(
  wpq: QualificationRecord | null,
  ndt: NdtDtRecord[],
): number {
  if (!wpq) return 1;

  let max = 2;

  const testSaved = Boolean(
    wpq.filler_group?.trim() ||
      wpq.test_thickness_mm != null ||
      wpq.deposited_thickness_mm != null,
  );
  if (testSaved) max = 3;

  const ndtSaved = Boolean(
    ndt.length > 0 ||
      wpq.wpq_status === "Pending_NDT" ||
      wpq.wpq_status === "Approved" ||
      wpq.wpq_status === "Failed",
  );
  if (ndtSaved) max = 4;

  return max;
}

export function welderGroupMaxStep(
  sharedPlan: Record<string, unknown>,
  sharedTestPiece: Record<string, unknown>,
  wpq: QualificationRecord | null,
  ndt: NdtDtRecord[],
): number {
  if (wpq) return welderQualifyMaxStep(wpq, ndt);
  if (Object.keys(sharedTestPiece).length > 0) return 3;
  return Object.keys(sharedPlan).length > 0 ? 2 : 1;
}

export function operatorGroupMaxStep(
  sharedPlan: Record<string, unknown>,
  sharedTestPiece: Record<string, unknown>,
  oq: OperatorQualification | null,
  ndt: OperatorNdtRecord[],
): number {
  if (oq) return operatorQualifyMaxStep(oq, ndt);
  if (Object.keys(sharedTestPiece).length > 0) return 3;
  return Object.keys(sharedPlan).length > 0 ? 2 : 1;
}
