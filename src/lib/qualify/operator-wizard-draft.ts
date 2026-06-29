import type { OperatorQualification } from "@/types/db";

const KEY = "welddoc_operator_qualify_draft";

export function operatorQualifyDraftKey(operatorId: string, oqId: string | null) {
  return `${KEY}:${operatorId}:${oqId ?? "new"}`;
}

export function loadOperatorQualifyDraft(key: string): Record<string, string> | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

export function saveOperatorQualifyDraft(key: string, data: Record<string, string>) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify(data));
}

export function oqToDraftDefaults(oq: OperatorQualification | null): Record<string, string> {
  if (!oq) return {};
  const entries: Array<[string, string | null | undefined]> = [
    ["date_of_welding", oq.date_of_welding],
    ["welding_type", oq.welding_type],
    ["process", oq.process],
    ["product_type", oq.product_type],
    ["joint_type", oq.joint_type],
    ["welding_mode", oq.welding_mode],
    ["wps_reference", oq.wps_reference],
    ["employer_branch", oq.employer_branch],
    ["functional_knowledge_ref", oq.functional_knowledge_ref],
    ["welding_technology_knowledge", oq.welding_technology_knowledge],
    ["examiner_ref", oq.examiner_ref],
    ["examiner_name", oq.examiner_name],
    ["revalidation_method", oq.revalidation_method],
    ["equipment_power_source", oq.equipment_power_source],
    ["equipment_unit_details", oq.equipment_unit_details],
    ["visual_or_remote_control", oq.visual_or_remote_control],
    ["automatic_joint_tracking", oq.automatic_joint_tracking],
    ["automatic_arc_length_control", oq.automatic_arc_length_control],
    ["single_multi_run", oq.single_multi_run],
    ["orbital_position", oq.orbital_position],
    ["material_backing", oq.material_backing],
    ["material_backing_type", oq.material_backing_type],
    ["consumable_insert", oq.consumable_insert],
    ["material_spec_info", oq.material_spec_info],
    ["test_piece_dimensions_info", oq.test_piece_dimensions_info],
    ["filler_designation_info", oq.filler_designation_info],
    ["qualification_test_method", oq.qualification_test_method],
    ["method1_standard", oq.method1_standard],
  ];
  const out: Record<string, string> = {};
  for (const [k, v] of entries) {
    if (v) out[k] = v;
  }
  return out;
}
