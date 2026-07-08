import { WELDING_PROCESSES } from "@/lib/iso9606/constants";
import {
  FUSION_JOINT_TYPES,
  FUSION_PRODUCT_TYPES,
  METHOD1_STANDARDS,
  QUALIFICATION_TEST_METHODS,
  RESISTANCE_JOINT_TYPES,
  RESISTANCE_PRODUCT_TYPES,
  REVALIDATION_METHODS,
  WELDING_MODES,
  WELDING_TYPES,
  requiredNdtTests,
} from "@/lib/iso14732/constants";
import { computeOperatorExpiry } from "@/lib/iso14732/expiry";
import { normalizePlantOperatorId } from "@/lib/operators/plant-id";
import { isValidEmailFormat, normalizeOptionalEmail } from "@/lib/utils";
import {
  NDT_RESULT_COLUMN_BY_METHOD,
  OPERATOR_QUAL_REQUIRED_KEYS,
} from "./columns";
import { normalizeOperatorRawRow } from "./normalize";
import type {
  OperatorImportFields,
  OperatorImportValidationError,
  OperatorImportValidationResult,
  OperatorQualImportFields,
  RawOperatorImportRow,
  ValidatedOperatorImportRow,
} from "./types";
import type {
  OperatorQualification,
  OperatorQualificationTestMethod,
  OperatorRevalidationMethod,
  OperatorWeldingMode,
  OperatorWeldingType,
  OqStatus,
  TestResult,
} from "@/types/db";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const STATUS_SET = new Set(["Active", "Inactive", "Suspended"]);
const NDT_RESULTS = new Set<TestResult>(["Pass", "Fail", "NA"]);

const PROCESS_CODES = new Set(WELDING_PROCESSES.map((p) => p.code));
const WELDING_TYPE_SET = new Set<string>(WELDING_TYPES);
const WELDING_MODE_SET = new Set<string>(WELDING_MODES);
const QUAL_METHOD_SET = new Set(QUALIFICATION_TEST_METHODS.map((m) => m.code));
const REVAL_SET = new Set(REVALIDATION_METHODS.map((m) => m.code));
const METHOD1_SET = new Set<string>(METHOD1_STANDARDS);

const NDT_IMPORT_COLUMNS = [
  "result_vt",
  "result_mt_pt",
  "result_macro",
  "result_bend_or_macro",
  "result_fracture_macro",
  "result_rt_ut_bend",
  "result_ut_bend",
] as const;

function str(raw: RawOperatorImportRow, key: string): string | null {
  const v = raw[key];
  if (v == null || v === "") return null;
  return String(v).trim();
}

function hasAnyQualField(raw: RawOperatorImportRow): boolean {
  // Only the core qualification fields trigger the qualification block, so a
  // stray value in an optional column doesn't force a whole qualification.
  return OPERATOR_QUAL_REQUIRED_KEYS.some((k) => str(raw, k) != null);
}

function parseDate(
  raw: RawOperatorImportRow,
  key: string,
  excelRow: number,
  errors: OperatorImportValidationError[],
  required = false,
): string | null {
  const value = str(raw, key);
  if (!value) {
    if (required) {
      errors.push({ excelRow, column: key, message: `${key} is required.` });
    }
    return null;
  }
  if (!ISO_DATE.test(value)) {
    errors.push({
      excelRow,
      column: key,
      message: `${key} must be YYYY-MM-DD.`,
    });
    return null;
  }
  return value;
}

function parseNdt(
  raw: RawOperatorImportRow,
  key: string,
  excelRow: number,
  errors: OperatorImportValidationError[],
  fallback: TestResult,
): TestResult {
  const value = str(raw, key);
  if (!value) return fallback;
  if (!NDT_RESULTS.has(value as TestResult)) {
    errors.push({
      excelRow,
      column: key,
      message: `${key} must be Pass, Fail, or NA.`,
    });
    return fallback;
  }
  return value as TestResult;
}

function operatorGroupKey(operator: OperatorImportFields): string {
  if (operator.plantOperatorId) return operator.plantOperatorId;
  return `__auto:${operatorFingerprint(operator)}`;
}

function operatorFingerprint(o: OperatorImportFields): string {
  return [
    o.fullName,
    o.email ?? "",
    o.dateOfBirth,
    o.placeOfBirth,
    o.idMethod,
    o.idNumber,
    o.operatorStatus,
  ].join("|");
}

function oqStatusFromResults(results: TestResult[]): OqStatus {
  if (results.some((r) => r === "Fail")) return "Failed";
  return "Approved";
}

function parseOperator(
  raw: RawOperatorImportRow,
  excelRow: number,
  errors: OperatorImportValidationError[],
): OperatorImportFields | null {
  // Plant/Operator ID (O# No) is required — used to match an imported
  // qualification to an existing operator or create a new one.
  const plantRaw = str(raw, "plant_operator_id");
  const plantOperatorId = plantRaw
    ? (normalizePlantOperatorId(plantRaw) ?? "")
    : "";
  if (!plantRaw) {
    errors.push({
      excelRow,
      column: "plant_operator_id",
      message: "plant_operator_id (O# No) is required.",
    });
    return null;
  }
  if (!plantOperatorId) {
    errors.push({
      excelRow,
      column: "plant_operator_id",
      message: "plant_operator_id is invalid. Use O#01 / O#1 / 1 format.",
    });
    return null;
  }

  const fullName = str(raw, "full_name");
  if (!fullName) {
    errors.push({ excelRow, column: "full_name", message: "full_name is required." });
    return null;
  }

  // Personal details are optional (legacy sheets rarely include them).
  const dateOfBirth = parseDate(raw, "date_of_birth", excelRow, errors);
  const placeOfBirth = str(raw, "place_of_birth");
  const idMethod = str(raw, "id_method");
  const idNumber = str(raw, "id_number");

  const emailRaw = str(raw, "email");
  let email: string | null = null;
  if (emailRaw) {
    if (!isValidEmailFormat(emailRaw)) {
      errors.push({ excelRow, column: "email", message: "email must be valid." });
      return null;
    }
    email = normalizeOptionalEmail(emailRaw);
  }

  const statusRaw = str(raw, "operator_status") ?? "Active";
  if (!STATUS_SET.has(statusRaw)) {
    errors.push({
      excelRow,
      column: "operator_status",
      message: "operator_status must be Active, Inactive, or Suspended.",
    });
    return null;
  }

  return {
    plantOperatorId,
    fullName,
    email,
    dateOfBirth,
    placeOfBirth,
    idMethod,
    idNumber,
    operatorStatus: statusRaw as OperatorImportFields["operatorStatus"],
  };
}

function parseQualification(
  raw: RawOperatorImportRow,
  excelRow: number,
  errors: OperatorImportValidationError[],
): OperatorQualImportFields | null {
  if (!hasAnyQualField(raw)) return null;

  const weldingType = str(raw, "welding_type");
  if (!weldingType || !WELDING_TYPE_SET.has(weldingType)) {
    errors.push({
      excelRow,
      column: "welding_type",
      message: `welding_type must be ${WELDING_TYPES.join(" | ")}.`,
    });
    return null;
  }

  const weldingMode = str(raw, "welding_mode");
  if (!weldingMode || !WELDING_MODE_SET.has(weldingMode)) {
    errors.push({
      excelRow,
      column: "welding_mode",
      message: `welding_mode must be ${WELDING_MODES.join(" | ")}.`,
    });
    return null;
  }

  const process = str(raw, "process");
  if (!process || !PROCESS_CODES.has(process as never)) {
    errors.push({
      excelRow,
      column: "process",
      message: "process must be a valid ISO 4063 code.",
    });
    return null;
  }

  const productType = str(raw, "product_type");
  const jointType = str(raw, "joint_type");
  const allowedProducts =
    weldingType === "Resistance"
      ? RESISTANCE_PRODUCT_TYPES
      : FUSION_PRODUCT_TYPES;
  const allowedJoints =
    weldingType === "Resistance"
      ? RESISTANCE_JOINT_TYPES
      : FUSION_JOINT_TYPES;

  if (!productType || !allowedProducts.includes(productType as never)) {
    errors.push({
      excelRow,
      column: "product_type",
      message: `product_type invalid for ${weldingType} welding.`,
    });
    return null;
  }

  if (!jointType || !allowedJoints.includes(jointType as never)) {
    errors.push({
      excelRow,
      column: "joint_type",
      message: `joint_type invalid for ${weldingType} welding.`,
    });
    return null;
  }

  const qualMethod = str(raw, "qualification_test_method");
  if (!qualMethod || !QUAL_METHOD_SET.has(qualMethod as never)) {
    errors.push({
      excelRow,
      column: "qualification_test_method",
      message: `qualification_test_method must be one of: ${[...QUAL_METHOD_SET].join(", ")}.`,
    });
    return null;
  }

  const method1Standard = str(raw, "method1_standard");
  if (qualMethod === "Method_1" && method1Standard && !METHOD1_SET.has(method1Standard)) {
    errors.push({
      excelRow,
      column: "method1_standard",
      message: `method1_standard must be ${METHOD1_STANDARDS.join(" | ")}.`,
    });
    return null;
  }

  const dateOfWelding = parseDate(raw, "date_of_welding", excelRow, errors, true);
  const expiryOverride = parseDate(raw, "expiry_date", excelRow, errors);
  const continuityOverride = parseDate(
    raw,
    "continuity_last_verified",
    excelRow,
    errors,
  );

  const revalidationMethod = str(raw, "revalidation_method");
  if (!revalidationMethod || !REVAL_SET.has(revalidationMethod as never)) {
    errors.push({
      excelRow,
      column: "revalidation_method",
      message: `revalidation_method must be ${REVALIDATION_METHODS.map((m) => m.code).join(" | ")}.`,
    });
    return null;
  }

  if (!dateOfWelding) return null;

  if (expiryOverride && expiryOverride < dateOfWelding) {
    errors.push({
      excelRow,
      column: "expiry_date",
      message: "expiry_date cannot be before date_of_welding.",
    });
    return null;
  }

  const ndtResults: Partial<Record<string, TestResult>> = {};
  for (const col of NDT_IMPORT_COLUMNS) {
    const fallback: TestResult = col === "result_vt" ? "Pass" : "NA";
    ndtResults[col] = parseNdt(raw, col, excelRow, errors, fallback);
  }

  const oqShape = {
    qualification_test_method: qualMethod as OperatorQualificationTestMethod,
    method1_standard: method1Standard,
    welding_type: weldingType as OperatorWeldingType,
    product_type: productType,
    joint_type: jointType,
    process,
  } satisfies Pick<
    OperatorQualification,
    | "qualification_test_method"
    | "method1_standard"
    | "welding_type"
    | "product_type"
    | "joint_type"
    | "process"
  >;

  const requiredTests = requiredNdtTests(oqShape);
  const results = requiredTests.map((t) => {
    const col = NDT_RESULT_COLUMN_BY_METHOD[t.method];
    return (col ? ndtResults[col] : undefined) ?? (t.method === "VT" ? "Pass" : "NA");
  });

  const method = revalidationMethod as OperatorRevalidationMethod;
  const expiryDate =
    expiryOverride ?? computeOperatorExpiry(dateOfWelding, method);
  const continuityLastVerified = continuityOverride ?? dateOfWelding;

  return {
    weldingType: weldingType as OperatorWeldingType,
    weldingMode: weldingMode as OperatorWeldingMode,
    process,
    productType,
    jointType,
    qualificationTestMethod: qualMethod as OperatorQualificationTestMethod,
    method1Standard: method1Standard,
    dateOfWelding,
    revalidationMethod: method,
    examinerName: str(raw, "examiner_name"),
    expiryDate,
    continuityLastVerified,
    ndtResults,
    oqStatus: oqStatusFromResults(results),
  };
}

export function validateOperatorParsedImport(
  parsed: Array<{ excelRow: number; raw: RawOperatorImportRow }>,
  existingPlantIds: Set<string>,
): OperatorImportValidationResult {
  const errors: OperatorImportValidationError[] = [];
  const rows: ValidatedOperatorImportRow[] = [];

  const seenGroups = new Map<string, number>();
  const fingerprintByGroup = new Map<string, string>();

  for (const { excelRow, raw: rawInput } of parsed) {
    // Coerce real-world encodings (labels, casing, British spelling, date
    // formats, method numbers) to canonical codes. The normalized map is also
    // what the preview grid renders, so nothing disappears.
    const normalized = normalizeOperatorRawRow(rawInput);
    const raw: RawOperatorImportRow = normalized;

    const operator = parseOperator(raw, excelRow, errors);
    if (!operator) continue;

    if (operator.plantOperatorId) {
      normalized.plant_operator_id = operator.plantOperatorId;
    }

    const groupKey = operatorGroupKey(operator);

    // An operator already in the org is fine — the qualification(s) on this row
    // will be attached to that operator at commit time. Only flag rows in this
    // same file that reuse a plant ID with conflicting operator details.
    const prevRow = seenGroups.get(groupKey);
    if (prevRow != null) {
      const fp = operatorFingerprint(operator);
      const priorFp = fingerprintByGroup.get(groupKey);
      if (priorFp && priorFp !== fp) {
        errors.push({
          excelRow,
          column: "plant_operator_id",
          message: `Row ${excelRow} conflicts with row ${prevRow}: same plant_operator_id but different operator details.`,
        });
      }
    } else {
      seenGroups.set(groupKey, excelRow);
      fingerprintByGroup.set(groupKey, operatorFingerprint(operator));
    }

    let qualification: OperatorQualImportFields | null = null;
    if (hasAnyQualField(raw)) {
      for (const key of OPERATOR_QUAL_REQUIRED_KEYS) {
        if (!str(raw, key)) {
          errors.push({
            excelRow,
            column: key,
            message: `${key} is required when importing qualifications.`,
          });
        }
      }
      qualification = parseQualification(raw, excelRow, errors);
    }

    rows.push({ excelRow, operator, qualification, raw: normalized });
  }

  const uniqueOperators = new Set(rows.map((r) => r.operator.plantOperatorId));
  let existingOperatorCount = 0;
  let newOperatorCount = 0;
  for (const plantId of uniqueOperators) {
    if (existingPlantIds.has(plantId)) existingOperatorCount += 1;
    else newOperatorCount += 1;
  }
  const qualificationCount = rows.filter((r) => r.qualification).length;

  return {
    ok: errors.length === 0,
    rows,
    errors,
    summary: {
      totalRows: rows.length,
      operatorCount: uniqueOperators.size,
      existingOperatorCount,
      newOperatorCount,
      qualificationCount,
      errorCount: errors.length,
    },
  };
}
