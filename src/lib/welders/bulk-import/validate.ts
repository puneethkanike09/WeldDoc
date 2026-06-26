import {
  FILLER_GROUPS,
  JOINT_TYPES,
  MATERIAL_GROUPS,
  PRODUCT_TYPES,
  REVALIDATION_METHODS,
  TESTING_STANDARDS,
  WELDING_PROCESSES,
  BW_POSITIONS,
  FW_POSITIONS,
} from "@/lib/iso9606/constants";
import { computeExpiry } from "@/lib/expiry";
import { normalizePlantWelderId } from "@/lib/welders/plant-id";
import { QUAL_COLUMN_KEYS, QUAL_REQUIRED_KEYS } from "./columns";
import type {
  ImportValidationError,
  ImportValidationResult,
  QualificationImportFields,
  RawImportRow,
  ValidatedImportRow,
  WelderImportFields,
} from "./types";
import type {
  ProductType,
  RevalidationMethod,
  TestResult,
  WelderStatus,
  WpqStatus,
} from "@/types/db";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const PROCESS_CODES = new Set<string>(WELDING_PROCESSES.map((p) => p.code));
const JOINT_CODES = new Set<string>(JOINT_TYPES.map((j) => j.code));
const POSITION_CODES = new Set<string>([...BW_POSITIONS, ...FW_POSITIONS]);
const MATERIAL_CODES = new Set<string>(MATERIAL_GROUPS.map((m) => m.code));
const FILLER_CODES = new Set<string>(FILLER_GROUPS.map((f) => f.code));
const PRODUCT_SET = new Set<string>(PRODUCT_TYPES);
const REVAL_CODES = new Set(REVALIDATION_METHODS.map((m) => m.code));
const TESTING_CODES = new Set<string>(TESTING_STANDARDS.map((s) => s.code));
const WELDER_STATUS_SET = new Set<WelderStatus>([
  "Active",
  "Inactive",
  "Suspended",
]);
const NDT_RESULTS = new Set<TestResult>(["Pass", "Fail", "NA"]);

function str(raw: RawImportRow, key: string): string | null {
  const v = raw[key];
  if (v == null || v === "") return null;
  return String(v).trim() || null;
}

function hasAnyQualField(raw: RawImportRow): boolean {
  return QUAL_COLUMN_KEYS.some((k) => str(raw, k) != null);
}

function parseDate(
  raw: RawImportRow,
  key: string,
  excelRow: number,
  errors: ImportValidationError[],
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
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) {
    errors.push({ excelRow, column: key, message: `${key} is not a valid date.` });
    return null;
  }
  return value;
}

function parseNumber(
  raw: RawImportRow,
  key: string,
  excelRow: number,
  errors: ImportValidationError[],
  required = false,
): number | null {
  const value = str(raw, key);
  if (!value) {
    if (required) {
      errors.push({ excelRow, column: key, message: `${key} is required.` });
    }
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    errors.push({
      excelRow,
      column: key,
      message: `${key} must be a number.`,
    });
    return null;
  }
  return n;
}

function parseNdt(
  raw: RawImportRow,
  key: string,
  excelRow: number,
  errors: ImportValidationError[],
  defaultValue: TestResult,
): TestResult {
  const value = str(raw, key);
  if (!value) return defaultValue;
  if (!NDT_RESULTS.has(value as TestResult)) {
    errors.push({
      excelRow,
      column: key,
      message: `${key} must be Pass, Fail, or NA.`,
    });
    return defaultValue;
  }
  return value as TestResult;
}

function welderFingerprint(w: WelderImportFields): string {
  return [
    w.fullName,
    w.dateOfBirth,
    w.placeOfBirth,
    w.idMethod,
    w.idNumber,
    w.welderStatus,
  ].join("|");
}

function welderGroupKey(w: WelderImportFields): string {
  return w.plantWelderId || `__auto:${welderFingerprint(w)}`;
}

function wpqStatusFromNdt(
  vt: TestResult,
  rtUt: TestResult,
  fracture: TestResult,
): WpqStatus {
  if (vt === "Fail" || rtUt === "Fail" || fracture === "Fail") return "Failed";
  return "Approved";
}

function parseWelder(
  raw: RawImportRow,
  excelRow: number,
  errors: ImportValidationError[],
): WelderImportFields | null {
  const plantRaw = str(raw, "plant_welder_id");
  const plantWelderId = plantRaw ? (normalizePlantWelderId(plantRaw) ?? "") : "";
  if (plantRaw && !plantWelderId) {
    errors.push({
      excelRow,
      column: "plant_welder_id",
      message:
        "plant_welder_id is invalid. Use W#01 format or leave blank to auto-assign.",
    });
    return null;
  }

  const fullName = str(raw, "full_name");
  if (!fullName) {
    errors.push({ excelRow, column: "full_name", message: "full_name is required." });
    return null;
  }

  const dateOfBirth = parseDate(raw, "date_of_birth", excelRow, errors, true);
  const placeOfBirth = str(raw, "place_of_birth");
  if (!placeOfBirth) {
    errors.push({
      excelRow,
      column: "place_of_birth",
      message: "place_of_birth is required.",
    });
    return null;
  }

  const idMethod = str(raw, "id_method");
  if (!idMethod) {
    errors.push({
      excelRow,
      column: "id_method",
      message: "id_method is required.",
    });
    return null;
  }

  const idNumber = str(raw, "id_number");
  if (!idNumber) {
    errors.push({ excelRow, column: "id_number", message: "id_number is required." });
    return null;
  }

  const statusRaw = str(raw, "welder_status") ?? "Active";
  if (!WELDER_STATUS_SET.has(statusRaw as WelderStatus)) {
    errors.push({
      excelRow,
      column: "welder_status",
      message: "welder_status must be Active, Inactive, or Suspended.",
    });
    return null;
  }

  if (!dateOfBirth) return null;

  return {
    plantWelderId,
    fullName,
    dateOfBirth,
    placeOfBirth,
    idMethod,
    idNumber,
    welderStatus: statusRaw as WelderStatus,
  };
}

function parseQualification(
  raw: RawImportRow,
  excelRow: number,
  errors: ImportValidationError[],
): QualificationImportFields | null {
  if (!hasAnyQualField(raw)) return null;

  for (const key of QUAL_REQUIRED_KEYS) {
    if (!str(raw, key)) {
      errors.push({
        excelRow,
        column: key,
        message: `When importing qualifications, ${key} is required.`,
      });
    }
  }

  const process = str(raw, "process");
  if (process && !PROCESS_CODES.has(process)) {
    errors.push({
      excelRow,
      column: "process",
      message: `Invalid process code.`,
    });
  }

  const jointType = str(raw, "joint_type");
  if (jointType && !JOINT_CODES.has(jointType)) {
    errors.push({
      excelRow,
      column: "joint_type",
      message: "joint_type must be BW or FW.",
    });
  }

  const position = str(raw, "position");
  if (position && !POSITION_CODES.has(position)) {
    errors.push({
      excelRow,
      column: "position",
      message: "Invalid position code.",
    });
  }

  const baseMaterialGroup = str(raw, "base_material_group");
  if (baseMaterialGroup && !MATERIAL_CODES.has(baseMaterialGroup)) {
    errors.push({
      excelRow,
      column: "base_material_group",
      message: "Invalid material group code (1–11).",
    });
  }

  const fillerGroup = str(raw, "filler_group");
  if (fillerGroup && !FILLER_CODES.has(fillerGroup)) {
    errors.push({
      excelRow,
      column: "filler_group",
      message: "Invalid filler group (FM1–FM6).",
    });
  }

  const product = str(raw, "product");
  if (product && !PRODUCT_SET.has(product)) {
    errors.push({
      excelRow,
      column: "product",
      message: "product must be Plate, Pipe, Branch, or Other.",
    });
  }

  const testingStandard = str(raw, "testing_standard") ?? "EN ISO 9606-1:2017";
  if (!TESTING_CODES.has(testingStandard)) {
    errors.push({
      excelRow,
      column: "testing_standard",
      message: `testing_standard must be one of: ${[...TESTING_CODES].join(", ")}.`,
    });
  }

  const revalidationMethod = str(raw, "revalidation_method");
  if (
    revalidationMethod &&
    !REVAL_CODES.has(revalidationMethod as RevalidationMethod)
  ) {
    errors.push({
      excelRow,
      column: "revalidation_method",
      message: "revalidation_method must be 9.3a, 9.3b, or 9.3c.",
    });
  }

  const testThicknessMm = parseNumber(
    raw,
    "test_thickness_mm",
    excelRow,
    errors,
    true,
  );
  const depositedThicknessMm = parseNumber(
    raw,
    "deposited_thickness_mm",
    excelRow,
    errors,
  );
  const pipeOdMm = parseNumber(raw, "pipe_od_mm", excelRow, errors);

  const dateOfWelding = parseDate(raw, "date_of_welding", excelRow, errors, true);
  const expiryOverride = parseDate(raw, "expiry_date", excelRow, errors);
  const continuityOverride = parseDate(
    raw,
    "continuity_last_verified",
    excelRow,
    errors,
  );

  if (dateOfWelding && expiryOverride && expiryOverride < dateOfWelding) {
    errors.push({
      excelRow,
      column: "expiry_date",
      message: "expiry_date cannot be before date_of_welding.",
    });
  }

  const resultVt = parseNdt(raw, "result_vt", excelRow, errors, "Pass");
  const resultRtUt = parseNdt(raw, "result_rt_ut", excelRow, errors, "NA");
  const resultFracture = parseNdt(raw, "result_fracture", excelRow, errors, "NA");

  if (
    !process ||
    !jointType ||
    !position ||
    !baseMaterialGroup ||
    testThicknessMm == null ||
    !product ||
    !dateOfWelding ||
    !revalidationMethod
  ) {
    return null;
  }

  const method = revalidationMethod as RevalidationMethod;
  const expiryDate = expiryOverride ?? computeExpiry(method, dateOfWelding);
  const continuityLastVerified = continuityOverride ?? dateOfWelding;

  return {
    process,
    jointType,
    position,
    baseMaterialGroup,
    fillerGroup: fillerGroup ?? "FM1",
    testThicknessMm,
    depositedThicknessMm,
    pipeOdMm,
    product: product as ProductType,
    testingStandard,
    dateOfWelding,
    expiryDate,
    revalidationMethod: method,
    continuityLastVerified,
    resultVt,
    resultRtUt,
    resultFracture,
    wpqStatus: wpqStatusFromNdt(resultVt, resultRtUt, resultFracture),
  };
}

export function validateImportRows(
  parsed: Array<{ excelRow: number; raw: RawImportRow }>,
  existingPlantIds: Set<string>,
): ImportValidationResult {
  const errors: ImportValidationError[] = [];
  const rows: ValidatedImportRow[] = [];

  const seenGroups = new Map<string, number>();
  const fingerprintByGroup = new Map<string, string>();

  for (const { excelRow, raw } of parsed) {
    const welder = parseWelder(raw, excelRow, errors);
    if (!welder) continue;

    const groupKey = welderGroupKey(welder);

    if (welder.plantWelderId && existingPlantIds.has(welder.plantWelderId)) {
      errors.push({
        excelRow,
        column: "plant_welder_id",
        message: `Plant welder ID "${welder.plantWelderId}" already exists in your organisation.`,
      });
    }

    const prevRow = seenGroups.get(groupKey);
    if (prevRow != null) {
      const fp = welderFingerprint(welder);
      const priorFp = fingerprintByGroup.get(groupKey);
      if (priorFp && priorFp !== fp) {
        errors.push({
          excelRow,
          column: "plant_welder_id",
          message: `Welder details conflict with another row for the same plant ID.`,
        });
      }
    } else {
      seenGroups.set(groupKey, excelRow);
      fingerprintByGroup.set(groupKey, welderFingerprint(welder));
    }

    const qualification = parseQualification(raw, excelRow, errors);
    rows.push({ excelRow, welder, qualification });
  }

  const uniqueWelders = new Set(rows.map((r) => welderGroupKey(r.welder)));
  const qualCount = rows.filter((r) => r.qualification).length;

  return {
    ok: errors.length === 0,
    rows,
    errors,
    summary: {
      totalRows: rows.length,
      welderCount: uniqueWelders.size,
      qualificationCount: qualCount,
      errorCount: errors.length,
    },
  };
}

export function validateParsedImport(
  parsed: Array<{ excelRow: number; raw: RawImportRow }>,
  existingPlantIds: Iterable<string>,
): ImportValidationResult {
  return validateImportRows(parsed, new Set(existingPlantIds));
}
