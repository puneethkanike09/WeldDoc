import type { DashboardWidgetsConfig } from "@/lib/dashboard/widgets";

export type WelderStatus = "Active" | "Inactive" | "Suspended";
export type WeldingStandard = "ISO_9606_1" | "ASME_IX" | "AWS_D1_1" | "ISO_14732";
export type JointCategory = "BW" | "FW";
/** Extended joint types when product is Other (client registry). */
export type ExtendedJointType =
  | JointCategory
  | "Lap"
  | "Edge"
  | "Corner"
  | "Overlay"
  | "Product Base";
export type BranchConnection = "set_in" | "set_on" | "set_through";
export type ProductType = "Plate" | "Pipe" | "Branch" | "Other";
export type WpqStatus =
  | "Draft"
  | "Pending_NDT"
  | "Approved"
  | "Failed"
  | "Expired"
  | "Superseded";
export type RevalidationMethod = "9.3a" | "9.3b" | "9.3c";
export type ValidationKind = "continuity" | "revalidation";
export type TestResult = "Pass" | "Fail" | "NA";

export type QualificationSessionStatus = "Draft" | "Pending_NDT" | "Closed";
export type QualificationSessionMemberStatus =
  | "Draft"
  | "Pending_NDT"
  | "Approved"
  | "Failed"
  | "Removed";

export interface QualificationSession {
  id: string;
  org_id: string;
  standard: WeldingStandard;
  session_status: QualificationSessionStatus;
  label: string | null;
  shared_plan: Record<string, unknown>;
  shared_test_piece: Record<string, unknown>;
  shared_ndt: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QualificationSessionMember {
  id: string;
  session_id: string;
  org_id: string;
  welder_id: string | null;
  operator_id: string | null;
  qualification_id: string | null;
  member_status: QualificationSessionMemberStatus;
  ndt_results: Record<string, unknown>;
  created_at: string;
}

export type AlertEmailFrequency =
  | "once"
  | "daily"
  | "every_2_days"
  | "weekly"
  | "twice_weekly"
  | "every_3_weeks";

export interface Organization {
  id: string;
  name: string;
  logo_path: string | null;
  location_code: string | null;
  report_prefix: string;
  wpq_seq: number;
  welder_seq: number;
  operator_seq: number;
  alert_emails: string[];
  alert_lead_days: number[];
  alert_email_frequency: AlertEmailFrequency;
  dashboard_widgets: DashboardWidgetsConfig | null;
  created_at: string;
}

export interface Profile {
  id: string;
  org_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

export interface Welder {
  id: string;
  org_id: string;
  welder_id: string | null;
  full_name: string;
  date_of_birth: string | null;
  place_of_birth: string | null;
  id_method: string | null;
  id_number: string | null;
  employer: string | null;
  branch_location: string | null;
  photo_path: string | null;
  qr_token: string;
  status: WelderStatus;
  is_new_welder: boolean;
  created_by: string | null;
  created_at: string;
}

export interface QualificationTestReport {
  id: string;
  org_id: string;
  report_number: string;
  joint_category: JointCategory;
  test_date: string;
  wps_no: string | null;
  remarks: string | null;
  sheet_pdf_path: string | null;
  created_by: string | null;
  created_at: string;
}

export interface QualificationRecord {
  id: string;
  org_id: string;
  welder_id: string;
  report_id: string | null;
  standard: WeldingStandard;
  process: string;
  joint_type: JointCategory;
  joint_type_extended: string | null;
  position: string | null;
  product: ProductType;
  branch_connection: BranchConnection | null;
  base_material_group: string | null;
  material_specification: string | null;
  material_grade: string | null;
  material2_specification: string | null;
  material2_grade: string | null;
  material2_group: string | null;
  dimensions: string | null;
  dimension_thickness_mm: number | null;
  dimension_width_mm: number | null;
  dimension_length_mm: number | null;
  dimension2_thickness_mm: number | null;
  dimension2_width_mm: number | null;
  dimension2_length_mm: number | null;
  dimension2_pipe_od_mm: number | null;
  dimensions2: string | null;
  testing_standard: string | null;
  filler_group: string | null;
  filler_designation: string | null;
  filler_type: string | null;
  shielding_gas: string | null;
  current_polarity: string | null;
  test_thickness_mm: number | null;
  deposited_thickness_mm: number | null;
  pipe_od_mm: number | null;
  layer_type: string | null;
  transfer_mode: string | null;
  weld_details: string | null;
  // Multi-process (ISO 9606-1): optional second process on the same test piece.
  // process_2 === null means a single-process qualification.
  process_2: string | null;
  process2_filler_group: string | null;
  process2_filler_designation: string | null;
  process2_filler_type: string | null;
  process2_shielding_gas: string | null;
  process2_current_polarity: string | null;
  process2_transfer_mode: string | null;
  process2_weld_details: string | null;
  process2_layer_type: string | null;
  process2_deposited_thickness_mm: number | null;
  job_knowledge: string;
  supplementary_fillet: boolean;
  supplementary_fillet_position: string | null;
  supplementary_fillet_thickness_mm: number | null;
  supplementary_fillet_process: string | null;
  wps_reference: string | null;
  examiner_ref: string | null;
  examiner_name: string | null;
  date_of_welding: string | null;
  revalidation_method: RevalidationMethod;
  wpq_status: WpqStatus;
  cloned_from: string | null;
  is_legacy: boolean;
  certificate_issued_date: string | null;
  certificate_pdf_path: string | null;
  signed_certificate_pdf_path: string | null;
  legacy_document_paths: string[];
  continuity_last_verified: string | null;
  expiry_date: string | null;
  created_at: string;
}

export interface RangeOfApproval {
  id: string;
  wpq_id: string;
  thickness_min_mm: number | null;
  thickness_max_mm: number | null;
  thickness_unlimited: boolean;
  pipe_od_min_mm: number | null;
  pipe_od_max_mm: number | null;
  pipe_od_unlimited: boolean;
  approved_positions: string[];
  approved_material_groups: string[];
  approved_joint_types: string[];
  summary: string | null;
  created_at: string;
}

export interface NdtDtRecord {
  id: string;
  org_id: string;
  wpq_id: string;
  test_method: string;
  result: TestResult;
  report_pdf_path: string | null;
  conducted_by: string | null;
  test_date: string | null;
  created_at: string;
}

export interface ValidationRecord {
  id: string;
  org_id: string;
  wpq_id: string;
  validated_on: string;
  supporting_doc_path: string | null;
  new_expiry_date: string | null;
  validator_name: string | null;
  note: string | null;
  kind: ValidationKind;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  org_id: string;
  wpq_id: string | null;
  welder_id: string | null;
  operator_qualification_id: string | null;
  operator_id: string | null;
  alert_type: string;
  expiry_date: string | null;
  channel: string;
  status: string;
  sent_at: string;
}

export type OperatorWeldingType = "Fusion" | "Resistance";
export type OperatorWeldingMode = "Mechanized" | "Automatic";
export type OperatorRevalidationMethod = "6.3a" | "6.3b" | "6.3c";
export type OperatorQualificationTestMethod =
  | "Method_1"
  | "Method_2"
  | "Method_3"
  | "Method_4";
export type OperatorTechnologyKnowledge = "Acceptable" | "Not_Acceptable";
export type OqStatus = WpqStatus;

export interface Operator {
  id: string;
  org_id: string;
  operator_id: string | null;
  full_name: string;
  date_of_birth: string | null;
  place_of_birth: string | null;
  id_method: string | null;
  id_number: string | null;
  employer: string | null;
  branch_location: string | null;
  photo_path: string | null;
  qr_token: string;
  status: WelderStatus;
  is_new_operator: boolean;
  created_by: string | null;
  created_at: string;
}

export interface OperatorQualification {
  id: string;
  org_id: string;
  operator_id: string;
  standard: WeldingStandard;
  testing_standard: string;
  date_of_welding: string | null;
  welding_type: OperatorWeldingType | null;
  process: string | null;
  product_type: string | null;
  joint_type: string | null;
  welding_mode: OperatorWeldingMode | null;
  wps_reference: string | null;
  employer_branch: string | null;
  functional_knowledge_ref: string | null;
  welding_technology_knowledge: OperatorTechnologyKnowledge | null;
  examiner_ref: string | null;
  examiner_name: string | null;
  revalidation_method: OperatorRevalidationMethod;
  equipment_power_source: string | null;
  equipment_unit_details: string | null;
  visual_or_remote_control: string | null;
  automatic_joint_tracking: string | null;
  automatic_arc_length_control: string | null;
  single_multi_run: string | null;
  orbital_position: string | null;
  material_backing: string | null;
  material_backing_type: string | null;
  consumable_insert: string | null;
  material_spec_info: string | null;
  test_piece_dimensions_info: string | null;
  filler_designation_info: string | null;
  qualification_test_method: OperatorQualificationTestMethod | null;
  method1_standard: string | null;
  oq_status: OqStatus;
  cloned_from: string | null;
  is_legacy: boolean;
  certificate_issued_date: string | null;
  certificate_pdf_path: string | null;
  signed_certificate_pdf_path: string | null;
  continuity_last_verified: string | null;
  expiry_date: string | null;
  created_at: string;
}

export interface OperatorRange {
  id: string;
  oq_id: string;
  summary: string | null;
  range_lines: string[];
  created_at: string;
}

export interface OperatorNdtRecord {
  id: string;
  org_id: string;
  oq_id: string;
  test_method: string;
  result: TestResult;
  report_pdf_path: string | null;
  conducted_by: string | null;
  test_date: string | null;
  created_at: string;
}

export interface OperatorValidation {
  id: string;
  org_id: string;
  oq_id: string;
  validated_on: string;
  supporting_doc_path: string | null;
  new_expiry_date: string | null;
  validator_name: string | null;
  note: string | null;
  kind: ValidationKind;
  created_at: string;
}
