/**
 * Client registry field parity (page 1 — ~31 items across welder + qualify wizard).
 * Required fields match Ram's Excel: no optional gaps on the new-welder path.
 */

import type { JointCategory, ProductType } from "@/types/db";
import { requiredTestsFor } from "@/lib/iso9606/constants";

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
export function validateQualificationPlan(formData: FormData) {
  requireText(str(formData.get("testing_standard")), "Code / testing standard");
  requireText(str(formData.get("process")), "Welding process");
  requireText(str(formData.get("joint_type")), "Joint type");
  requireText(str(formData.get("product")), "Product type");
  requireText(str(formData.get("position")), "Welding position");
  requireText(str(formData.get("base_material_group")), "Parent material group");
  requireText(str(formData.get("wps_reference")), "WPS reference");
  requireText(str(formData.get("date_of_welding")), "Date of welding test");
  requireText(str(formData.get("examiner_ref")), "Examiner / body reference");
  requireText(str(formData.get("examiner_name")), "Examiner name");
  requireText(str(formData.get("revalidation_method")), "Revalidation method");
}

/** Step 2 — test piece fields 18–31. */
export function validateTestPiece(
  formData: FormData,
  jointType: JointCategory,
  product: ProductType,
) {
  requireText(str(formData.get("material_grade")), "Material 1 grade");
  requireText(str(formData.get("material_standard")), "Material 1 specification");
  requireText(str(formData.get("base_material_group")), "Material 1 parent group");
  requireText(str(formData.get("filler_group")), "Filler material group");
  requireText(str(formData.get("filler_designation")), "Filler designation");
  requireText(str(formData.get("filler_type")), "Filler type");
  requireText(str(formData.get("shielding_gas")), "Shielding gas");
  requireText(str(formData.get("current_polarity")), "Current & polarity");
  requireText(str(formData.get("transfer_mode")), "Transfer mode");
  requireText(str(formData.get("weld_details")), "Weld details");
  requireText(str(formData.get("layer_type")), "Layer type");
  requireText(str(formData.get("position")), "Welding position");

  requireNumber(num(formData.get("test_thickness_mm")), "Test thickness (mm)");
  requireNumber(
    num(formData.get("deposited_thickness_mm")),
    "Deposited / throat thickness (mm)",
  );

  const t = num(formData.get("dimension_thickness_mm"));
  const w = num(formData.get("dimension_width_mm"));
  const l = num(formData.get("dimension_length_mm"));
  const dimsText = str(formData.get("dimensions"));
  if (!dimsText && (t == null || w == null || l == null)) {
    throw new QualificationValidationError(
      "Product dimensions (T × W × L mm) are required.",
    );
  }

  if (product === "Pipe" || product === "Branch") {
    requireNumber(num(formData.get("pipe_od_mm")), "Pipe outside diameter (mm)");
  }

  if (jointType === "BW" && !str(formData.get("material2_grade"))) {
    // Material 2 optional for dissimilar joints — no throw
  }
}

/** Step 3 — NDT / DT (page 2 A–G). */
export function validateNdtResults(
  formData: FormData,
  jointType: JointCategory,
) {
  const methods = [
    ...requiredTestsFor(jointType),
    ...formData.getAll("optional_method").map(String).filter(Boolean),
  ];

  for (const method of methods) {
    const result = str(formData.get(`result__${method}`));
    if (!result || result === "NA") {
      throw new QualificationValidationError(
        `${method}: result must be Pass or Fail (not N/A).`,
      );
    }
    if (requiredTestsFor(jointType).includes(method) && result !== "Pass") {
      throw new QualificationValidationError(
        `${method} must pass before issuing a certificate.`,
      );
    }
    requireText(
      str(formData.get(`test_date__${method}`)),
      `${method} test date`,
    );
    requireText(
      str(formData.get(`conducted_by__${method}`)),
      `${method} report / reference no.`,
    );
  }
}

/** Step 4 — certificate issue. */
export function validateCertificateIssue(formData: FormData) {
  requireText(str(formData.get("certificate_date")), "Certificate date");
  requireText(str(formData.get("examiner_name")), "Authorised examiner name");
  requireText(str(formData.get("job_knowledge")), "Job knowledge");
}
