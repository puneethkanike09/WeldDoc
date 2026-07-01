import type { SupabaseClient } from "@supabase/supabase-js";
import { TESTING_STANDARD } from "@/lib/iso14732/constants";
import { recomputeOperatorRange } from "@/lib/iso14732/recompute-operator-range";
import { snapshotStr } from "./form-helpers";
import type {
  OperatorQualification,
  OperatorRevalidationMethod,
  OperatorTechnologyKnowledge,
  OperatorWeldingMode,
  OperatorWeldingType,
  QualificationSessionMember,
} from "@/types/db";

export function operatorPlanPayload(
  orgId: string,
  operatorId: string,
  plan: Record<string, unknown>,
) {
  return {
    org_id: orgId,
    operator_id: operatorId,
    standard: "ISO_14732" as const,
    testing_standard: TESTING_STANDARD,
    date_of_welding: snapshotStr(plan, "date_of_welding"),
    welding_type: snapshotStr(plan, "welding_type") as OperatorWeldingType,
    process: snapshotStr(plan, "process"),
    product_type: snapshotStr(plan, "product_type"),
    joint_type: snapshotStr(plan, "joint_type"),
    welding_mode: snapshotStr(plan, "welding_mode") as OperatorWeldingMode,
    wps_reference: snapshotStr(plan, "wps_reference"),
    employer_branch: snapshotStr(plan, "employer_branch"),
    functional_knowledge_ref: snapshotStr(plan, "functional_knowledge_ref"),
    welding_technology_knowledge: snapshotStr(
      plan,
      "welding_technology_knowledge",
    ) as OperatorTechnologyKnowledge,
    examiner_ref: snapshotStr(plan, "examiner_ref"),
    examiner_name: snapshotStr(plan, "examiner_name"),
    revalidation_method: (snapshotStr(plan, "revalidation_method") ??
      "6.3b") as OperatorRevalidationMethod,
  };
}

export function operatorTestPiecePayload(testPiece: Record<string, unknown>) {
  return {
    equipment_power_source: snapshotStr(testPiece, "equipment_power_source"),
    equipment_unit_details: snapshotStr(testPiece, "equipment_unit_details"),
    visual_or_remote_control: snapshotStr(testPiece, "visual_or_remote_control"),
    automatic_joint_tracking: snapshotStr(testPiece, "automatic_joint_tracking"),
    automatic_arc_length_control: snapshotStr(
      testPiece,
      "automatic_arc_length_control",
    ),
    single_multi_run: snapshotStr(testPiece, "single_multi_run"),
    orbital_position: snapshotStr(testPiece, "orbital_position"),
    material_backing: snapshotStr(testPiece, "material_backing"),
    material_backing_type: snapshotStr(testPiece, "material_backing_type"),
    consumable_insert: snapshotStr(testPiece, "consumable_insert"),
    material_spec_info: snapshotStr(testPiece, "material_spec_info"),
    test_piece_dimensions_info: snapshotStr(
      testPiece,
      "test_piece_dimensions_info",
    ),
    filler_designation_info: snapshotStr(testPiece, "filler_designation_info"),
  };
}

export function operatorRecordFromSession(
  plan: Record<string, unknown>,
  testPiece: Record<string, unknown>,
  existing: OperatorQualification | null,
): OperatorQualification {
  const base: OperatorQualification = {
    id: existing?.id ?? "session-template",
    org_id: existing?.org_id ?? "",
    operator_id: existing?.operator_id ?? "",
    standard: "ISO_14732",
    testing_standard: TESTING_STANDARD,
    date_of_welding: null,
    welding_type: null,
    process: null,
    product_type: null,
    joint_type: null,
    welding_mode: null,
    wps_reference: null,
    employer_branch: null,
    functional_knowledge_ref: null,
    welding_technology_knowledge: null,
    examiner_ref: null,
    examiner_name: null,
    revalidation_method: "6.3b",
    equipment_power_source: null,
    equipment_unit_details: null,
    visual_or_remote_control: null,
    automatic_joint_tracking: null,
    automatic_arc_length_control: null,
    single_multi_run: null,
    orbital_position: null,
    material_backing: null,
    material_backing_type: null,
    consumable_insert: null,
    material_spec_info: null,
    test_piece_dimensions_info: null,
    filler_designation_info: null,
    qualification_test_method: null,
    method1_standard: null,
    oq_status: "Draft",
    cloned_from: null,
    is_legacy: false,
    certificate_issued_date: null,
    certificate_pdf_path: null,
    signed_certificate_pdf_path: null,
    continuity_last_verified: null,
    expiry_date: null,
    created_at: "",
  };

  const planFields = operatorPlanPayload("", "", plan);
  const testFields = operatorTestPiecePayload(testPiece);

  return {
    ...base,
    ...planFields,
    ...testFields,
    id: existing?.id ?? base.id,
    operator_id: existing?.operator_id ?? base.operator_id,
    org_id: existing?.org_id ?? base.org_id,
    oq_status: existing?.oq_status ?? "Draft",
  };
}

export async function materializeOperatorMembers(
  supabase: SupabaseClient,
  orgId: string,
  members: QualificationSessionMember[],
  plan: Record<string, unknown>,
  testPiece: Record<string, unknown>,
): Promise<void> {
  const hasTestPiece = Object.keys(testPiece).length > 0;
  const testPayload = hasTestPiece ? operatorTestPiecePayload(testPiece) : {};

  for (const member of members) {
    if (!member.operator_id || member.member_status === "Removed") continue;
    if (member.member_status === "Approved") continue;

    const planPayload = operatorPlanPayload(orgId, member.operator_id, plan);
    const payload = { ...planPayload, ...testPayload };

    let oqId = member.qualification_id;

    if (oqId) {
      const { error } = await supabase
        .from("operator_qualifications")
        .update(payload)
        .eq("id", oqId)
        .eq("org_id", orgId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase
        .from("operator_qualifications")
        .insert({ ...payload, oq_status: "Draft" })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      oqId = data.id;

      await supabase
        .from("qualification_session_members")
        .update({ qualification_id: oqId })
        .eq("id", member.id)
        .eq("org_id", orgId);
    }

    if (oqId) await recomputeOperatorRange(oqId);
  }
}
