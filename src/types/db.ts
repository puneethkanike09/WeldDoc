export type WelderStatus = "Active" | "Inactive" | "Suspended";
export type WeldingStandard = "ISO_9606_1" | "ASME_IX" | "AWS_D1_1";
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

export interface Organization {
  id: string;
  name: string;
  logo_path: string | null;
  location_code: string | null;
  uid_prefix: string;
  report_prefix: string;
  wpq_seq: number;
  welder_seq: number;
  alert_emails: string[];
  alert_lead_days: number[];
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
  uid: string;
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
  job_knowledge: string;
  supplementary_fillet: boolean;
  supplementary_fillet_position: string | null;
  supplementary_fillet_thickness_mm: number | null;
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
  alert_type: string;
  expiry_date: string | null;
  channel: string;
  status: string;
  sent_at: string;
}
