/**
 * Client registry field parity (page 1 — ~31 items across welder + qualify wizard).
 * Required fields match Ram's Excel: no optional gaps on the new-welder path.
 */

import type { JointCategory, NdtDtRecord, ProductType, QualificationRecord } from "@/types/db";
import { validateMaterialDimensions } from "@/lib/iso9606/product-dimensions";
import {
  showDepositedThicknessField,
  showTestThicknessField,
} from "@/lib/iso9606/test-piece-thickness";
import {
  ALL_NDT_TESTS,
  isVisualTestMethod,
  requiredTestsFor,
  VISUAL_TEST_METHOD,
} from "@/lib/iso9606/constants";

/** BW/FW tests apply; other joint types on “Others” product use BW as default. */
export function ndtJointCategory(jointType: string): JointCategory {
  return jointType === "FW" ? "FW" : "BW";
}

export class QualificationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QualificationValidationError";
  }
}

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

/** Client-side welder form validation — field-keyed errors for inline display. */
export function getWelderRegistrationFieldErrors(
  formData: FormData,
  mode: "create" | "edit",
  extras?: {
    dateOfBirth?: string;
    country?: string;
    state?: string;
    district?: string;
  },
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!str(formData.get("full_name"))) errors.full_name = "Full name is required.";
  if (!str(formData.get("welder_id"))) errors.welder_id = "Plant welder ID is required.";

  const dob = extras?.dateOfBirth ?? str(formData.get("date_of_birth"));
  if (!dob) errors.date_of_birth = "Select a date of birth.";

  const country = extras?.country ?? "";
  const state = extras?.state ?? "";
  const district = extras?.district ?? "";
  const placeFromForm = str(formData.get("place_of_birth"));
  const placeParts = (placeFromForm ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (extras?.country !== undefined) {
    if (!country) errors.country = "Select a country.";
    else if (!state) errors.state = "Select a state / region.";
    else if (!district.trim()) errors.district = "Enter a district / city.";
  } else if (placeParts.length < 3) {
    if (placeParts.length === 0) errors.country = "Select a country.";
    else if (placeParts.length === 1) errors.state = "Select a state / region.";
    else errors.district = "Enter a district / city.";
  }

  if (!str(formData.get("id_number"))) errors.id_number = "ID number is required.";
  if (!str(formData.get("employer"))) errors.employer = "Employer is required.";
  if (!str(formData.get("branch_location"))) errors.branch_location = "Branch / site is required.";

  const idMethod = str(formData.get("id_method"));
  if (!idMethod) errors.id_method = "ID method is required.";
  if (idMethod === "Other" && !str(formData.get("id_method_other"))) {
    errors.id_method_other = "Specify the ID method.";
  }

  if (mode === "create") {
    const photo = formData.get("photo");
    if (!(photo instanceof File) || photo.size === 0) {
      errors.photo = "Photograph is required for certificate and ID card.";
    }
  }

  return errors;
}

/** @deprecated Use getWelderRegistrationFieldErrors — kept for tests if any */
export function collectWelderRegistrationErrors(
  formData: FormData,
  mode: "create" | "edit",
  extras?: {
    dateOfBirth?: string;
    country?: string;
    state?: string;
    district?: string;
  },
): string[] {
  return Object.values(getWelderRegistrationFieldErrors(formData, mode, extras));
}

function num(v: FormDataEntryValue | null): number | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function requireText(
  value: string | null | undefined,
  label: string,
): string {
  if (!value?.trim()) {
    throw new QualificationValidationError(`${label} is required.`);
  }
  return value.trim();
}

function requireNumber(value: number | null, label: string): number {
  if (value == null || !Number.isFinite(value)) {
    throw new QualificationValidationError(`${label} is required.`);
  }
  return value;
}

/** Welder registration — fields 1–8 on the client Excel page 1. */
export function validateWelderRegistration(
  formData: FormData,
  mode: "create" | "edit",
) {
  requireText(str(formData.get("full_name")), "Full name");
  requireText(str(formData.get("welder_id")), "Plant welder ID");
  requireText(str(formData.get("date_of_birth")), "Date of birth");
  requireText(str(formData.get("place_of_birth")), "Place of birth");
  requireText(str(formData.get("id_number")), "ID number");
  requireText(str(formData.get("employer")), "Employer");
  requireText(str(formData.get("branch_location")), "Branch / site");

  const idMethod = str(formData.get("id_method"));
  if (!idMethod) {
    throw new QualificationValidationError("ID method is required.");
  }
  if (idMethod === "Other" && !str(formData.get("id_method_other"))) {
    throw new QualificationValidationError("Specify the ID method.");
  }

  if (mode === "create") {
    const photo = formData.get("photo");
    if (!(photo instanceof File) || photo.size === 0) {
      throw new QualificationValidationError(
        "Photograph is required for certificate and ID card.",
      );
    }
  }
}

/** Step 1 — plan fields 9–17. */
export function getQualificationPlanFieldErrors(
  formData: FormData,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!str(formData.get("testing_standard"))) {
    errors.testing_standard = "Code / testing standard is required.";
  }
  if (!str(formData.get("process"))) errors.process = "Welding process is required.";
  const process2 = str(formData.get("process_2"));
  if (process2 && process2 === str(formData.get("process"))) {
    errors.process_2 = "Second process must differ from the first.";
  }
  if (!str(formData.get("joint_type"))) errors.joint_type = "Joint type is required.";
  if (!str(formData.get("product"))) errors.product = "Product type is required.";
  const product = str(formData.get("product"));
  if (product === "Branch" && !str(formData.get("branch_connection"))) {
    errors.branch_connection = "Branch connection is required.";
  }
  if (!str(formData.get("position"))) errors.position = "Welding position is required.";
  if (process2 && !str(formData.get("position_2"))) {
    errors.position_2 = "Process 2 welding position is required.";
  }
  if (!str(formData.get("wps_reference"))) errors.wps_reference = "WPS reference is required.";
  if (!str(formData.get("date_of_welding"))) {
    errors.date_of_welding = "Date of welding is required.";
  }
  if (!str(formData.get("examiner_ref"))) {
    errors.examiner_ref = "Examiner / body reference is required.";
  }
  if (!str(formData.get("examiner_name"))) {
    errors.examiner_name = "Examiner name is required.";
  }
  if (!str(formData.get("revalidation_method"))) {
    errors.revalidation_method = "Confirmation of revalidation is required.";
  }
  const joint = str(formData.get("joint_type"));
  if (joint !== "FW") {
    if (formData.get("supplementary_fillet") === "on") {
      if (!str(formData.get("supplementary_fillet_position"))) {
        errors.supplementary_fillet_position =
          "Supplementary fillet position is required.";
      }
      if (num(formData.get("supplementary_fillet_thickness_mm")) == null) {
        errors.supplementary_fillet_thickness_mm =
          "Supplementary fillet material thickness is required.";
      }
    }
    if (process2 && formData.get("supplementary_fillet_2") === "on") {
      if (!str(formData.get("supplementary_fillet_2_position"))) {
        errors.supplementary_fillet_2_position =
          "Process 2 supplementary fillet position is required.";
      }
      if (num(formData.get("supplementary_fillet_2_thickness_mm")) == null) {
        errors.supplementary_fillet_2_thickness_mm =
          "Process 2 supplementary fillet material thickness is required.";
      }
    }
  }
  if (joint === "Branch" && !str(formData.get("branch_connection"))) {
    errors.branch_connection = "Branch connection is required.";
  }
  return errors;
}

export function validateQualificationPlan(formData: FormData) {
  const errors = getQualificationPlanFieldErrors(formData);
  const first = Object.values(errors)[0];
  if (first) throw new QualificationValidationError(first);
}

/** Step 2 — test piece fields 18–31. */
export function getTestPieceFieldErrors(
  formData: FormData,
  jointType: string,
  product: ProductType,
  options?: { hasSecondProcess?: boolean; showDepositedThickness?: boolean },
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!str(formData.get("material_grade"))) {
    errors.material_grade = "Material grade is required.";
  }
  if (!str(formData.get("material_standard"))) {
    errors.material_standard = "Material standard is required.";
  }
  if (!str(formData.get("base_material_group"))) {
    errors.base_material_group = "Parent material group is required.";
  }
  if (!str(formData.get("material2_grade"))) {
    errors.material2_grade = "Material 2 grade is required.";
  }
  if (!str(formData.get("material2_specification"))) {
    errors.material2_specification = "Material 2 standard is required.";
  }
  if (!str(formData.get("material2_group"))) {
    errors.material2_group = "Material 2 parent material group is required.";
  }
  if (!str(formData.get("filler_group"))) {
    errors.filler_group = "Filler material group is required.";
  }
  if (!str(formData.get("filler_designation"))) {
    errors.filler_designation = "Filler designation is required.";
  }
  if (!str(formData.get("filler_type"))) errors.filler_type = "Filler type is required.";
  if (!str(formData.get("shielding_gas"))) {
    errors.shielding_gas = "Shielding gas is required.";
  }
  if (!str(formData.get("current_polarity"))) {
    errors.current_polarity = "Current & polarity is required.";
  }
  if (!str(formData.get("transfer_mode"))) {
    errors.transfer_mode = "Transfer mode is required.";
  }
  if (!str(formData.get("weld_details"))) errors.weld_details = "Weld details is required.";
  if (!str(formData.get("layer_type"))) errors.layer_type = "Layer is required.";

  const category = ndtJointCategory(jointType);

  if (showTestThicknessField(product, category, jointType)) {
    if (num(formData.get("test_thickness_mm")) == null) {
      errors.test_thickness_mm = "Material thickness is required.";
    }
  }
  if (showDepositedThicknessField(product, category, jointType)) {
    if (num(formData.get("deposited_thickness_mm")) == null) {
      errors.deposited_thickness_mm = "Deposited thickness is required.";
    }
  }

  if (options?.hasSecondProcess) {
    if (!str(formData.get("process2_filler_group"))) {
      errors.process2_filler_group = "Filler material group is required.";
    }
    if (!str(formData.get("process2_filler_designation"))) {
      errors.process2_filler_designation = "Filler designation is required.";
    }
    if (!str(formData.get("process2_filler_type"))) {
      errors.process2_filler_type = "Filler type is required.";
    }
    if (!str(formData.get("process2_shielding_gas"))) {
      errors.process2_shielding_gas = "Shielding gas is required.";
    }
    if (!str(formData.get("process2_current_polarity"))) {
      errors.process2_current_polarity = "Current & polarity is required.";
    }
    if (!str(formData.get("process2_transfer_mode"))) {
      errors.process2_transfer_mode = "Transfer mode is required.";
    }
    if (!str(formData.get("process2_weld_details"))) {
      errors.process2_weld_details = "Weld details is required.";
    }
    if (!str(formData.get("process2_layer_type"))) {
      errors.process2_layer_type = "Layer is required.";
    }
    const showDeposited =
      options.showDepositedThickness ??
      showDepositedThicknessField(product, ndtJointCategory(jointType), jointType);
    if (showDeposited && num(formData.get("process2_deposited_thickness_mm")) == null) {
      errors.process2_deposited_thickness_mm =
        "Deposited thickness is required.";
    }
  }

  Object.assign(errors, validateMaterialDimensions(formData, product, jointType));

  return errors;
}

export function validateTestPiece(
  formData: FormData,
  jointType: string,
  product: ProductType,
  options?: { hasSecondProcess?: boolean; showDepositedThickness?: boolean },
) {
  const errors = getTestPieceFieldErrors(formData, jointType, product, options);
  const first = Object.values(errors)[0];
  if (first) throw new QualificationValidationError(first);
}

function selectedNdtMethods(formData: FormData): string[] {
  return formData.getAll("selected_method").map(String).filter(Boolean);
}

/** Default checked tests: saved rows only, or joint-type suggestions on first visit. */
export function initialSelectedNdtTests(
  jointType: JointCategory,
  records: Pick<NdtDtRecord, "test_method">[],
): string[] {
  if (records.length > 0) {
    const selected = new Set<string>();
    for (const record of records) {
      if (isVisualTestMethod(record.test_method)) {
        selected.add(VISUAL_TEST_METHOD);
      } else if (
        (ALL_NDT_TESTS as readonly string[]).includes(record.test_method)
      ) {
        selected.add(record.test_method);
      }
    }
    return ALL_NDT_TESTS.filter((method) => selected.has(method));
  }
  return [...requiredTestsFor(jointType)];
}

/** Step 3 — NDT / DT (page 2 A–G). Only checked tests are validated. */
export function getNdtFieldErrors(
  formData: FormData,
  _jointType: JointCategory,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const methods = selectedNdtMethods(formData);

  for (const method of methods) {
    const result = str(formData.get(`result__${method}`));
    if (!result || result === "NA") {
      errors[`result__${method}`] = `${method}: select Pass or Fail.`;
    }
    if (!str(formData.get(`test_date__${method}`))) {
      errors[`test_date__${method}`] = `${method} test date is required.`;
    }
    if (!str(formData.get(`conducted_by__${method}`))) {
      errors[`conducted_by__${method}`] = `${method} report / reference no. is required.`;
    }
  }

  return errors;
}

export function validateNdtResults(
  formData: FormData,
  jointType: JointCategory,
) {
  const errors = getNdtFieldErrors(formData, jointType);
  const first = Object.values(errors)[0];
  if (first) throw new QualificationValidationError(first);
}

/** Step 4 — certificate issue. */
export function getCertificateIssueFieldErrors(
  formData: FormData,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!str(formData.get("certificate_date"))) {
    errors.certificate_date = "Certificate date is required.";
  }
  if (!str(formData.get("examiner_name"))) {
    errors.examiner_name = "Authorised examiner name is required.";
  }
  if (!str(formData.get("job_knowledge"))) {
    errors.job_knowledge = "Job knowledge is required.";
  }
  return errors;
}

export function validateCertificateIssue(formData: FormData) {
  const errors = getCertificateIssueFieldErrors(formData);
  const first = Object.values(errors)[0];
  if (first) throw new QualificationValidationError(first);
}

/** True when every saved NDT row is Pass (checked tests only). */
export function ndtTestsComplete(
  _jointType: JointCategory,
  records: Pick<NdtDtRecord, "test_method" | "result">[],
): boolean {
  if (records.length === 0) return false;
  return records.every((r) => r.result === "Pass");
}

/** Resolve saved NDT row for a required/optional test (supports legacy visual names). */
export function ndtRecordForMethod(
  records: NdtDtRecord[],
  method: string,
): NdtDtRecord | undefined {
  const direct = records.find((r) => r.test_method === method);
  if (direct) return direct;
  if (isVisualTestMethod(method)) {
    return records.find((r) => isVisualTestMethod(r.test_method));
  }
  return undefined;
}

/** WPQ is ready for certificate issue (Step 4). */
export function wpqReadyForCertificate(
  wpq: Pick<QualificationRecord, "wpq_status" | "joint_type">,
  ndtRecords: Pick<NdtDtRecord, "test_method" | "result">[],
): boolean {
  if (wpq.wpq_status === "Failed") return false;
  if (wpq.wpq_status !== "Pending_NDT") return false;
  return ndtTestsComplete(ndtJointCategory(wpq.joint_type), ndtRecords);
}
