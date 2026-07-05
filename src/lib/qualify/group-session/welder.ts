import type { SupabaseClient } from "@supabase/supabase-js";
import { recomputeWpqRange } from "@/lib/iso9606/recompute-wpq-range";
import { displayJointType, resolveJointStorage } from "@/lib/iso9606/product-dimensions";
import { formatShieldingGas } from "@/lib/iso9606/shielding-gas";
import {
  formNum,
  formStr,
  snapshotBool,
  snapshotNum,
  snapshotStr,
} from "./form-helpers";
import type {
  BranchConnection,
  ProductType,
  QualificationRecord,
  QualificationSessionMember,
  RevalidationMethod,
} from "@/types/db";

export function welderPlanPayload(
  orgId: string,
  welderId: string,
  plan: Record<string, unknown>,
) {
  const rawJoint = snapshotStr(plan, "joint_type") ?? "BW";
  const { joint_type, joint_type_extended } = resolveJointStorage(rawJoint);
  const product = (snapshotStr(plan, "product") ?? "Plate") as ProductType;

  return {
    org_id: orgId,
    welder_id: welderId,
    standard: "ISO_9606_1" as const,
    testing_standard:
      snapshotStr(plan, "testing_standard") ?? "EN ISO 9606-1:2017",
    process: snapshotStr(plan, "process") ?? "135",
    process_2: snapshotStr(plan, "process_2"),
    joint_type,
    joint_type_extended,
    product,
    branch_connection:
      joint_type_extended === "Branch" || product === "Branch"
        ? (snapshotStr(plan, "branch_connection") as BranchConnection)
        : null,
    position: snapshotStr(plan, "position"),
    wps_reference: snapshotStr(plan, "wps_reference"),
    examiner_ref: snapshotStr(plan, "examiner_ref"),
    examiner_name: snapshotStr(plan, "examiner_name"),
    date_of_welding: snapshotStr(plan, "date_of_welding"),
    revalidation_method: (snapshotStr(plan, "revalidation_method") ??
      "9.3b") as RevalidationMethod,
    supplementary_fillet: snapshotBool(plan, "supplementary_fillet"),
    supplementary_fillet_position: snapshotBool(plan, "supplementary_fillet")
      ? snapshotStr(plan, "supplementary_fillet_position")
      : null,
    supplementary_fillet_thickness_mm: snapshotBool(plan, "supplementary_fillet")
      ? snapshotNum(plan, "supplementary_fillet_thickness_mm")
      : null,
    supplementary_fillet_process:
      snapshotBool(plan, "supplementary_fillet") &&
      snapshotStr(plan, "process_2")
        ? snapshotStr(plan, "supplementary_fillet_process")
        : null,
    ...(snapshotStr(plan, "process_2")
      ? {}
      : {
          process2_filler_group: null,
          process2_filler_designation: null,
          process2_filler_type: null,
          process2_shielding_gas: null,
          process2_current_polarity: null,
          process2_transfer_mode: null,
          process2_weld_details: null,
          process2_layer_type: null,
          process2_deposited_thickness_mm: null,
        }),
  };
}

export function welderTestPiecePayload(testPiece: Record<string, unknown>) {
  return {
    material_specification: snapshotStr(testPiece, "material_standard"),
    material_grade: snapshotStr(testPiece, "material_grade"),
    base_material_group: snapshotStr(testPiece, "base_material_group"),
    material2_specification: snapshotStr(testPiece, "material2_specification"),
    material2_grade: snapshotStr(testPiece, "material2_grade"),
    material2_group: snapshotStr(testPiece, "material2_group"),
    dimensions: snapshotStr(testPiece, "dimensions"),
    dimensions2: snapshotStr(testPiece, "dimensions2"),
    dimension_thickness_mm: snapshotNum(testPiece, "dimension_thickness_mm"),
    dimension_width_mm: snapshotNum(testPiece, "dimension_width_mm"),
    dimension_length_mm: snapshotNum(testPiece, "dimension_length_mm"),
    dimension2_thickness_mm: snapshotNum(testPiece, "dimension2_thickness_mm"),
    dimension2_width_mm: snapshotNum(testPiece, "dimension2_width_mm"),
    dimension2_length_mm: snapshotNum(testPiece, "dimension2_length_mm"),
    dimension2_pipe_od_mm: snapshotNum(testPiece, "dimension2_pipe_od_mm"),
    filler_group: snapshotStr(testPiece, "filler_group"),
    filler_designation: snapshotStr(testPiece, "filler_designation"),
    filler_type: snapshotStr(testPiece, "filler_type"),
    shielding_gas: formatShieldingGas(snapshotStr(testPiece, "shielding_gas")),
    current_polarity: snapshotStr(testPiece, "current_polarity"),
    transfer_mode: snapshotStr(testPiece, "transfer_mode"),
    weld_details: snapshotStr(testPiece, "weld_details"),
    test_thickness_mm: snapshotNum(testPiece, "test_thickness_mm"),
    deposited_thickness_mm: snapshotNum(testPiece, "deposited_thickness_mm"),
    pipe_od_mm: snapshotNum(testPiece, "pipe_od_mm"),
    layer_type: snapshotStr(testPiece, "layer_type"),
    process2_filler_group: snapshotStr(testPiece, "process2_filler_group"),
    process2_filler_designation: snapshotStr(testPiece, "process2_filler_designation"),
    process2_filler_type: snapshotStr(testPiece, "process2_filler_type"),
    process2_shielding_gas: formatShieldingGas(
      snapshotStr(testPiece, "process2_shielding_gas"),
    ),
    process2_current_polarity: snapshotStr(testPiece, "process2_current_polarity"),
    process2_transfer_mode: snapshotStr(testPiece, "process2_transfer_mode"),
    process2_weld_details: snapshotStr(testPiece, "process2_weld_details"),
    process2_layer_type: snapshotStr(testPiece, "process2_layer_type"),
    process2_deposited_thickness_mm: snapshotNum(
      testPiece,
      "process2_deposited_thickness_mm",
    ),
    certificate_pdf_path: null,
  };
}

export function welderJointLabelFromPlan(plan: Record<string, unknown>): string {
  const rawJoint = snapshotStr(plan, "joint_type") ?? "BW";
  const { joint_type, joint_type_extended } = resolveJointStorage(rawJoint);
  return displayJointType({
    joint_type,
    joint_type_extended,
  } as QualificationRecord);
}

export function welderRecordFromSession(
  plan: Record<string, unknown>,
  testPiece: Record<string, unknown>,
  existing: QualificationRecord | null,
): QualificationRecord {
  const base: QualificationRecord = {
    id: existing?.id ?? "session-template",
    org_id: existing?.org_id ?? "",
    welder_id: existing?.welder_id ?? "",
    report_id: null,
    standard: "ISO_9606_1",
    process: "135",
    joint_type: "BW",
    joint_type_extended: null,
    position: null,
    product: "Plate",
    branch_connection: null,
    base_material_group: null,
    material_specification: null,
    material_grade: null,
    material2_specification: null,
    material2_grade: null,
    material2_group: null,
    dimensions: null,
    dimension_thickness_mm: null,
    dimension_width_mm: null,
    dimension_length_mm: null,
    dimension2_thickness_mm: null,
    dimension2_width_mm: null,
    dimension2_length_mm: null,
    dimension2_pipe_od_mm: null,
    dimensions2: null,
    testing_standard: "EN ISO 9606-1:2017",
    filler_group: null,
    filler_designation: null,
    filler_type: null,
    shielding_gas: null,
    current_polarity: null,
    test_thickness_mm: null,
    deposited_thickness_mm: null,
    pipe_od_mm: null,
    layer_type: null,
    transfer_mode: null,
    weld_details: null,
    process_2: null,
    process2_filler_group: null,
    process2_filler_designation: null,
    process2_filler_type: null,
    process2_shielding_gas: null,
    process2_current_polarity: null,
    process2_transfer_mode: null,
    process2_weld_details: null,
    process2_layer_type: null,
    process2_deposited_thickness_mm: null,
    job_knowledge: "",
    supplementary_fillet: false,
    supplementary_fillet_position: null,
    supplementary_fillet_thickness_mm: null,
    supplementary_fillet_process: null,
    wps_reference: null,
    examiner_ref: null,
    examiner_name: null,
    date_of_welding: null,
    revalidation_method: "9.3b",
    wpq_status: "Draft",
    cloned_from: null,
    is_legacy: false,
    certificate_issued_date: null,
    certificate_pdf_path: null,
    signed_certificate_pdf_path: null,
    legacy_document_paths: [],
    continuity_last_verified: null,
    expiry_date: null,
    created_at: "",
  };

  const planFields = welderPlanPayload("", "", plan);
  const testFields = welderTestPiecePayload(testPiece);

  return {
    ...base,
    ...planFields,
    ...testFields,
    id: existing?.id ?? base.id,
    welder_id: existing?.welder_id ?? base.welder_id,
    org_id: existing?.org_id ?? base.org_id,
    wpq_status: existing?.wpq_status ?? "Draft",
    job_knowledge: existing?.job_knowledge ?? "",
  };
}

export async function materializeWelderMembers(
  supabase: SupabaseClient,
  orgId: string,
  members: QualificationSessionMember[],
  plan: Record<string, unknown>,
  testPiece: Record<string, unknown>,
): Promise<void> {
  const hasTestPiece = Object.keys(testPiece).length > 0;
  const testPayload = hasTestPiece ? welderTestPiecePayload(testPiece) : {};

  for (const member of members) {
    if (!member.welder_id || member.member_status === "Removed") continue;
    if (member.member_status === "Approved") continue;

    const planPayload = welderPlanPayload(orgId, member.welder_id, plan);
    const payload = { ...planPayload, ...testPayload };

    let wpqId = member.qualification_id;

    if (wpqId) {
      const { error } = await supabase
        .from("qualification_records")
        .update(payload)
        .eq("id", wpqId)
        .eq("org_id", orgId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase
        .from("qualification_records")
        .insert({ ...payload, wpq_status: "Draft" })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      wpqId = data.id;

      await supabase
        .from("qualification_session_members")
        .update({ qualification_id: wpqId })
        .eq("id", member.id)
        .eq("org_id", orgId);
    }

    if (wpqId) await recomputeWpqRange(wpqId);
  }
}

/** Re-export for actions that build payloads from live FormData. */
export { formStr, formNum };
