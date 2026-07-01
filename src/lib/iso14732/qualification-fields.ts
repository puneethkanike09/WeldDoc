import {
  jointTypesFor,
  productTypesFor,
  requiredNdtTests,
  ndtResultsPass,
  showAutomaticFields,
  showMechanizedFields,
} from "@/lib/iso14732/constants";
import type {
  OperatorNdtRecord,
  OperatorQualification,
  OperatorWeldingMode,
  OperatorWeldingType,
  TestResult,
} from "@/types/db";

export class OperatorValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperatorValidationError";
  }
}

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function requireText(
  value: string | null | undefined,
  label: string,
): string {
  if (!value?.trim()) throw new OperatorValidationError(`${label} is required.`);
  return value.trim();
}

export function getOperatorPlanFieldErrors(formData: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!str(formData.get("date_of_welding"))) errors.date_of_welding = "Date of welding is required.";
  if (!str(formData.get("welding_type"))) errors.welding_type = "Select fusion or resistance welding.";
  if (!str(formData.get("process"))) errors.process = "Welding process is required.";
  if (!str(formData.get("product_type"))) errors.product_type = "Product type is required.";
  if (!str(formData.get("joint_type"))) errors.joint_type = "Joint type is required.";
  if (!str(formData.get("welding_mode"))) errors.welding_mode = "Select mechanized or automatic.";
  if (!str(formData.get("wps_reference"))) errors.wps_reference = "WPS reference is required.";
  if (!str(formData.get("employer_branch"))) errors.employer_branch = "Employer branch is required.";
  if (!str(formData.get("functional_knowledge_ref"))) {
    errors.functional_knowledge_ref = "Functional knowledge test reference is required.";
  }
  if (!str(formData.get("welding_technology_knowledge"))) {
    errors.welding_technology_knowledge = "Welding technology knowledge is required.";
  }
  if (!str(formData.get("examiner_ref"))) errors.examiner_ref = "Examiner reference is required.";
  if (!str(formData.get("examiner_name"))) errors.examiner_name = "Examiner name is required.";
  if (!str(formData.get("revalidation_method"))) {
    errors.revalidation_method = "Method of revalidation is required.";
  }

  const weldingType = str(formData.get("welding_type")) as OperatorWeldingType | null;
  const product = str(formData.get("product_type"));
  const joint = str(formData.get("joint_type"));
  if (weldingType && product && !productTypesFor(weldingType).includes(product)) {
    errors.product_type = "Invalid product type for selected welding type.";
  }
  if (weldingType && joint && !jointTypesFor(weldingType).includes(joint)) {
    errors.joint_type = "Invalid joint type for selected welding type.";
  }

  return errors;
}

export function validateOperatorPlan(formData: FormData) {
  const errors = getOperatorPlanFieldErrors(formData);
  const first = Object.values(errors)[0];
  if (first) throw new OperatorValidationError(first);
}

export function getOperatorTestPieceFieldErrors(
  formData: FormData,
  mode: OperatorWeldingMode | null,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!str(formData.get("equipment_power_source"))) {
    errors.equipment_power_source = "Welding equipment is required.";
  }
  if (!str(formData.get("equipment_unit_details"))) {
    errors.equipment_unit_details = "Welding unit details are required.";
  }

  if (showMechanizedFields(mode)) {
    if (!str(formData.get("visual_or_remote_control"))) {
      errors.visual_or_remote_control = "Select visual or remote control.";
    }
    if (!str(formData.get("automatic_joint_tracking"))) {
      errors.automatic_joint_tracking = "Select automatic joint tracking.";
    }
    if (!str(formData.get("automatic_arc_length_control"))) {
      errors.automatic_arc_length_control = "Select automatic arc length control.";
    }
    if (!str(formData.get("single_multi_run"))) {
      errors.single_multi_run = "Select single or multi run technique.";
    }
    if (!str(formData.get("orbital_position"))) {
      errors.orbital_position = "Select orbital welding position.";
    }
    if (!str(formData.get("material_backing"))) {
      errors.material_backing = "Select material backing.";
    }
    if (formData.get("material_backing") === "Yes" && !str(formData.get("material_backing_type"))) {
      errors.material_backing_type = "Select backing type.";
    }
    if (!str(formData.get("consumable_insert"))) {
      errors.consumable_insert = "Select consumable insert.";
    }
  }

  if (showAutomaticFields(mode) && !str(formData.get("single_multi_run"))) {
    errors.single_multi_run = "Select single or multi run technique.";
  }

  return errors;
}

export function validateOperatorTestPiece(
  formData: FormData,
  mode: OperatorWeldingMode | null,
) {
  const errors = getOperatorTestPieceFieldErrors(formData, mode);
  const first = Object.values(errors)[0];
  if (first) throw new OperatorValidationError(first);
}

export function getOperatorNdtFieldErrors(
  formData: FormData,
  oq: Pick<
    OperatorQualification,
    | "qualification_test_method"
    | "method1_standard"
    | "welding_type"
    | "product_type"
    | "joint_type"
    | "process"
  >,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const method = str(formData.get("qualification_test_method"));
  if (!method) {
    errors.qualification_test_method = "Select qualification test method.";
    return errors;
  }

  if (method === "Method_1" && !str(formData.get("method1_standard"))) {
    errors.method1_standard = "Select ISO 9606-1 or ISO 9606-2 for Method 1.";
  }

  const tests = requiredNdtTests({
    ...oq,
    qualification_test_method: method as OperatorQualification["qualification_test_method"],
    method1_standard: str(formData.get("method1_standard")),
  });

  for (const t of tests) {
    const key = `ndt_${t.method}`;
    const val = str(formData.get(key));
    if (!val || !["Pass", "Fail", "NA"].includes(val)) {
      errors[key] = `${t.label} result is required.`;
    }
    if (!str(formData.get(`test_date__${t.method}`))) {
      errors[`test_date__${t.method}`] = `${t.label} test date is required.`;
    }
    if (!str(formData.get(`conducted_by__${t.method}`))) {
      errors[`conducted_by__${t.method}`] =
        `${t.label} report / reference no. is required.`;
    }
  }

  return errors;
}

export function validateOperatorNdt(
  formData: FormData,
  oq: Pick<
    OperatorQualification,
    | "qualification_test_method"
    | "method1_standard"
    | "welding_type"
    | "product_type"
    | "joint_type"
    | "process"
  >,
) {
  validateOperatorNdtFields(formData, oq);

  const method = str(formData.get("qualification_test_method"))!;
  const tests = requiredNdtTests({
    ...oq,
    qualification_test_method: method as OperatorQualification["qualification_test_method"],
    method1_standard: str(formData.get("method1_standard")),
  });

  const results: TestResult[] = tests.map(
    (t) => str(formData.get(`ndt_${t.method}`)) as TestResult,
  );
  if (!ndtResultsPass(results)) {
    throw new OperatorValidationError("All required tests must pass to proceed.");
  }
}

/** Field presence only — used when group sessions may record Fail per member. */
export function validateOperatorNdtFields(
  formData: FormData,
  oq: Pick<
    OperatorQualification,
    | "qualification_test_method"
    | "method1_standard"
    | "welding_type"
    | "product_type"
    | "joint_type"
    | "process"
  >,
) {
  const errors = getOperatorNdtFieldErrors(formData, oq);
  const first = Object.values(errors)[0];
  if (first) throw new OperatorValidationError(first);
}

export function oqReadyForCertificate(oq: OperatorQualification): boolean {
  return (
    oq.oq_status === "Pending_NDT" ||
    oq.oq_status === "Approved" ||
    oq.oq_status === "Draft"
  );
}

export function ndtRecordForMethod(
  records: OperatorNdtRecord[],
  method: string,
): OperatorNdtRecord | undefined {
  return records.find((r) => r.test_method === method);
}

export function operatorNdtReady(
  oq: OperatorQualification,
  ndt: Pick<OperatorNdtRecord, "test_method" | "result">[],
): boolean {
  const tests = requiredNdtTests(oq);
  if (tests.length === 0) return false;
  const results = tests.map(
    (t) => ndt.find((r) => r.test_method === t.method)?.result ?? null,
  );
  return ndtResultsPass(
    results.filter((r): r is TestResult => r !== null),
  );
}

export function getOperatorCertificateIssueFieldErrors(
  formData: FormData,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!str(formData.get("certificate_date"))) {
    errors.certificate_date = "Certificate date is required.";
  }
  if (!str(formData.get("examiner_name"))) {
    errors.examiner_name = "Authorised examiner name is required.";
  }
  return errors;
}

export function validateOperatorCertificateIssue(formData: FormData) {
  const errors = getOperatorCertificateIssueFieldErrors(formData);
  const first = Object.values(errors)[0];
  if (first) throw new OperatorValidationError(first);
}
