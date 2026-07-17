import {
  BW_POSITIONS,
  FILLER_GROUPS,
  FW_POSITIONS,
  REVALIDATION_METHODS,
  WELDING_PROCESSES,
} from "@/lib/iso9606/constants";
import { computeExpiry } from "@/lib/expiry";
import { coerceIdNumberString } from "./id-number";
import { normalizePlantWelderId } from "@/lib/welders/plant-id";
import { QUAL_REQUIRED_KEYS, type ImportColumnKey } from "./columns";
import { fillForwardWelderFields } from "./fill-forward";
import {
  clientCellOrNull,
  parseClientJointMode,
  parseClientProcesses,
  parseClientThickness,
} from "./map-client-row";
import { normalizeRawRow } from "./normalize";
import { parseDateHistory } from "./parse-history";
import type {
  ImportValidationError,
  ImportValidationResult,
  ImportWarning,
  QualificationImportFields,
  RawImportRow,
  ValidatedImportRow,
  WelderImportFields,
} from "./types";
import type { RevalidationMethod } from "@/types/db";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const PROCESS_CODES = new Set<string>(WELDING_PROCESSES.map((p) => p.code));
const BW_POSITION_SET = new Set<string>(BW_POSITIONS);
const FW_POSITION_SET = new Set<string>(FW_POSITIONS);
const FILLER_CODES = new Set<string>(FILLER_GROUPS.map((f) => f.code));
const REVAL_CODES = new Set(REVALIDATION_METHODS.map((m) => m.code));

export type ImportValidationOptions = {
  existingIdNumbers?: Iterable<string>;
  welderSeq?: number;
};

export function normalizeImportIdNumber(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const coerced = coerceIdNumberString(raw.trim());
  if (coerced && /^\d+$/.test(coerced)) return coerced;
  return raw.trim().toUpperCase();
}

function str(raw: RawImportRow, key: string): string | null {
  const v = raw[key];
  if (v == null || v === "") return null;
  return String(v).trim() || null;
}

function hasAnyQualField(raw: RawImportRow): boolean {
  // Only the core qualification fields trigger the qualification block. A stray
  // value in an optional column (e.g. "NA" in a thickness cell) should not
  // force the user to fill in a whole qualification.
  return QUAL_REQUIRED_KEYS.some((k) => str(raw, k) != null);
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

/** Number cell that treats NA / blank as "unused" rather than an error. */
function parseClientNumberField(
  raw: RawImportRow,
  key: ImportColumnKey,
  excelRow: number,
  errors: ImportValidationError[],
): number | null {
  const cell = clientCellOrNull(str(raw, key));
  if (cell == null) return null;
  const n = parseClientThickness(cell);
  if (n == null) {
    errors.push({
      excelRow,
      column: key,
      message: `${key} must be a number (or NA).`,
    });
    return null;
  }
  return n;
}

function welderFingerprint(w: WelderImportFields): string {
  return [
    w.fullName,
    w.dateOfBirth ?? "",
    w.placeOfBirth ?? "",
    w.idMethod ?? "",
    w.idNumber ?? "",
    w.welderStatus,
  ].join("|");
}

/** True when both rows have a value for the field and those values differ. */
function conflictingOptional(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  return a.trim() !== b.trim();
}

/**
 * Same W# may appear on multiple certificate rows. Blank cells on later rows
 * must not conflict with values on earlier rows — only quarrel when both
 * sides entered different non-empty values.
 */
export function weldersConflict(
  a: WelderImportFields,
  b: WelderImportFields,
): boolean {
  if (a.fullName.trim() !== b.fullName.trim()) return true;
  if (conflictingOptional(a.dateOfBirth, b.dateOfBirth)) return true;
  if (conflictingOptional(a.placeOfBirth, b.placeOfBirth)) return true;
  if (conflictingOptional(a.idMethod, b.idMethod)) return true;
  if (conflictingOptional(a.idNumber, b.idNumber)) return true;
  if (a.welderStatus !== b.welderStatus) return true;
  return false;
}

/** Prefer filled fields when merging snapshot for later conflict checks. */
function mergeWelderSnapshot(
  prior: WelderImportFields,
  next: WelderImportFields,
): WelderImportFields {
  return {
    plantWelderId: next.plantWelderId || prior.plantWelderId,
    fullName: next.fullName || prior.fullName,
    dateOfBirth: next.dateOfBirth ?? prior.dateOfBirth,
    placeOfBirth: next.placeOfBirth ?? prior.placeOfBirth,
    idMethod: next.idMethod ?? prior.idMethod,
    idNumber: next.idNumber ?? prior.idNumber,
    photoFilename: next.photoFilename ?? prior.photoFilename,
    welderStatus: next.welderStatus || prior.welderStatus,
  };
}

function welderGroupKey(w: WelderImportFields): string {
  return w.plantWelderId || `__auto:${welderFingerprint(w)}`;
}

function resolveWpqStatus(
  ndtStatus: "Approved" | "Failed",
  expiryDate: string,
): QualificationImportFields["wpqStatus"] {
  if (ndtStatus === "Failed") return "Failed";
  const today = new Date().toISOString().slice(0, 10);
  if (expiryDate < today) return "Expired";
  return "Approved";
}

function parseWelder(
  raw: RawImportRow,
  excelRow: number,
  errors: ImportValidationError[],
): WelderImportFields | null {
  // Blank welder_id is allowed — preview assigns the next free W# before commit.
  const idRaw = str(raw, "welder_id");
  let plantWelderId = "";
  if (idRaw) {
    plantWelderId = normalizePlantWelderId(idRaw) ?? "";
    if (!plantWelderId) {
      errors.push({
        excelRow,
        column: "welder_id",
        message: "welder_id is invalid. Use W#01 / W#1 / 1 format.",
      });
      return null;
    }
  }

  const fullName = str(raw, "full_name");
  if (!fullName) {
    errors.push({ excelRow, column: "full_name", message: "full_name is required." });
    return null;
  }

  // Personal details are optional (legacy sheets rarely include them).
  const dateOfBirth = parseDate(raw, "date_of_birth", excelRow, errors);
  const idMethod = str(raw, "id_method");
  const idNumber = str(raw, "id_number");
  const photoFilename = str(raw, "photo_filename");

  return {
    plantWelderId,
    fullName,
    dateOfBirth,
    placeOfBirth: null,
    idMethod,
    idNumber,
    photoFilename,
    welderStatus: "Active",
  };
}

function parseQualification(
  raw: RawImportRow,
  excelRow: number,
  errors: ImportValidationError[],
  warnings: ImportWarning[],
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

  const processCell = str(raw, "process");
  const processes = processCell ? parseClientProcesses(processCell) : null;
  if (processCell && !processes) {
    errors.push({
      excelRow,
      column: "process",
      message: "process must be a single code or two codes joined by + (e.g. 136+135).",
    });
  }
  if (processes && !PROCESS_CODES.has(processes.process)) {
    errors.push({
      excelRow,
      column: "process",
      message: `Invalid process code: ${processes.process}.`,
    });
  }
  if (processes?.process2 && !PROCESS_CODES.has(processes.process2)) {
    errors.push({
      excelRow,
      column: "process",
      message: `Invalid process code: ${processes.process2}.`,
    });
  }

  const jointCell = str(raw, "joint_type");
  const jointMode = jointCell ? parseClientJointMode(jointCell) : null;
  if (jointCell && !jointMode) {
    errors.push({
      excelRow,
      column: "joint_type",
      message: "joint_type must be BW, FW, or BW/FW.",
    });
  }

  const bwPosition = clientCellOrNull(str(raw, "bw_position"));
  if (bwPosition && !BW_POSITION_SET.has(bwPosition)) {
    errors.push({
      excelRow,
      column: "bw_position",
      message: "Invalid BW position code.",
    });
  }
  const fwPosition = clientCellOrNull(str(raw, "fw_position"));
  if (fwPosition && !FW_POSITION_SET.has(fwPosition)) {
    errors.push({
      excelRow,
      column: "fw_position",
      message: "Invalid FW position code.",
    });
  }

  const bwThickness = parseClientNumberField(raw, "bw_test_thickness_mm", excelRow, errors);
  const fwThickness = parseClientNumberField(raw, "fw_test_thickness_mm", excelRow, errors);
  const pipeOdMm = parseClientNumberField(raw, "pipe_od_mm", excelRow, errors);

  const fillerGroupRaw = clientCellOrNull(str(raw, "filler_group"));
  if (fillerGroupRaw && !FILLER_CODES.has(fillerGroupRaw)) {
    errors.push({
      excelRow,
      column: "filler_group",
      message: "Invalid filler group (FM1–FM6).",
    });
  }
  const fillerGroup = fillerGroupRaw ?? "FM1";

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

  const dateOfWelding = parseDate(
    raw,
    "weld_test_revalidation_date",
    excelRow,
    errors,
    true,
  );
  const expiryOverride = parseDate(raw, "validation_expiry_date", excelRow, errors);

  const continuityHistory = parseDateHistory(
    str(raw, "continuity_last_verified"),
    "continuity_last_verified",
    excelRow,
    errors,
  );
  const continuityLastVerified =
    continuityHistory.length > 0
      ? continuityHistory[continuityHistory.length - 1]
      : null;
  const revalidationHistory: string[] = [];

  if (dateOfWelding && expiryOverride && expiryOverride < dateOfWelding) {
    errors.push({
      excelRow,
      column: "validation_expiry_date",
      message: "validation_expiry_date cannot be before weld_test_revalidation_date.",
    });
  }

  // NDT is not captured on the client template — legacy import assumes a
  // visual pass and leaves the destructive tests not-applicable.
  const resultVt: QualificationImportFields["resultVt"] = "Pass";
  const resultRtUt: QualificationImportFields["resultRtUt"] = "NA";
  const resultFracture: QualificationImportFields["resultFracture"] = "NA";

  // --- Option A joint / position / thickness mapping ---------------------
  let jointType: "BW" | "FW" = "BW";
  let position: string | null = null;
  let position2: string | null = null;
  let testThicknessMm: number | null = null;
  let depositedThicknessMm: number | null = null;
  let process2DepositedThicknessMm: number | null = null;
  let supplementaryFillet = false;
  let supplementaryFilletPosition: string | null = null;
  let supplementaryFilletThicknessMm: number | null = null;
  let supplementaryFillet2 = false;
  let supplementaryFillet2Position: string | null = null;
  let supplementaryFillet2ThicknessMm: number | null = null;

  if (jointMode === "FW") {
    jointType = "FW";
    if (!fwPosition) {
      errors.push({
        excelRow,
        column: "fw_position",
        message: "fw_position is required when joint_type is FW.",
      });
    }
    if (fwThickness == null) {
      errors.push({
        excelRow,
        column: "fw_test_thickness_mm",
        message: "fw_test_thickness_mm is required when joint_type is FW.",
      });
    }
    position = fwPosition;
    testThicknessMm = fwThickness;
    if (processes?.process2) {
      position2 = fwPosition;
    }
  } else if (jointMode === "BW") {
    jointType = "BW";
    if (!bwPosition) {
      errors.push({
        excelRow,
        column: "bw_position",
        message: "bw_position is required when joint_type is BW.",
      });
    }
    if (bwThickness == null) {
      errors.push({
        excelRow,
        column: "bw_test_thickness_mm",
        message: "bw_test_thickness_mm is required when joint_type is BW.",
      });
    }
    position = bwPosition;
    testThicknessMm = bwThickness;
    depositedThicknessMm = bwThickness;
    if (processes?.process2) {
      position2 = bwPosition;
      process2DepositedThicknessMm = bwThickness;
    }
  } else if (jointMode === "BW_FW") {
    jointType = "BW";
    if (!bwPosition) {
      errors.push({
        excelRow,
        column: "bw_position",
        message: "bw_position is required when joint_type is BW/FW.",
      });
    }
    if (bwThickness == null) {
      errors.push({
        excelRow,
        column: "bw_test_thickness_mm",
        message: "bw_test_thickness_mm is required when joint_type is BW/FW.",
      });
    }
    if (!fwPosition) {
      errors.push({
        excelRow,
        column: "fw_position",
        message: "fw_position is required when joint_type is BW/FW.",
      });
    }
    if (fwThickness == null) {
      errors.push({
        excelRow,
        column: "fw_test_thickness_mm",
        message: "fw_test_thickness_mm is required when joint_type is BW/FW.",
      });
    }
    position = bwPosition;
    testThicknessMm = bwThickness;
    depositedThicknessMm = bwThickness;
    supplementaryFillet = true;
    supplementaryFilletPosition = fwPosition;
    supplementaryFilletThicknessMm = fwThickness;
    if (processes?.process2) {
      position2 = bwPosition;
      process2DepositedThicknessMm = bwThickness;
      supplementaryFillet2 = true;
      supplementaryFillet2Position = fwPosition;
      supplementaryFillet2ThicknessMm = fwThickness;
    }
  }

  if (!expiryOverride && dateOfWelding) {
    warnings.push({
      excelRow,
      column: "validation_expiry_date",
      message:
        "Expiry estimated from test date and revalidation method — add validation_expiry_date from the certificate if you have it.",
    });
  }

  if (
    !processes ||
    !jointMode ||
    !position ||
    testThicknessMm == null ||
    !dateOfWelding ||
    !revalidationMethod
  ) {
    return null;
  }

  const method = revalidationMethod as RevalidationMethod;
  const expiryDate = expiryOverride ?? computeExpiry(method, dateOfWelding);

  return {
    process: processes.process,
    process2: processes.process2,
    jointType,
    jointMode,
    position,
    position2,
    baseMaterialGroup: "1",
    fillerGroup,
    testThicknessMm,
    depositedThicknessMm,
    process2DepositedThicknessMm,
    pipeOdMm,
    product: "Plate",
    testingStandard: "EN ISO 9606-1:2017",
    dateOfWelding,
    expiryDate,
    revalidationMethod: method,
    continuityLastVerified,
    continuityHistory,
    revalidationHistory,
    supplementaryFillet,
    supplementaryFilletPosition,
    supplementaryFilletThicknessMm,
    supplementaryFillet2,
    supplementaryFillet2Position,
    supplementaryFillet2ThicknessMm,
    resultVt,
    resultRtUt,
    resultFracture,
    wpqStatus: resolveWpqStatus("Approved", expiryDate),
  };
}

export function validateImportRows(
  parsed: Array<{ excelRow: number; raw: RawImportRow }>,
  existingPlantIds: Set<string>,
  options: ImportValidationOptions = {},
): ImportValidationResult {
  const errors: ImportValidationError[] = [];
  const warnings: ImportWarning[] = [];
  const rows: ValidatedImportRow[] = [];

  const welderByGroup = new Map<string, WelderImportFields>();

  const filled = fillForwardWelderFields(parsed);

  for (const { excelRow, raw: rawInput } of filled) {
    // Coerce common real-world encodings (labels, casing, date formats, units)
    // to the canonical codes the validator + dropdowns expect. The normalized
    // map is also what the preview grid renders, so nothing disappears.
    const normalized = normalizeRawRow(rawInput);
    const raw: RawImportRow = normalized;

    const welder = parseWelder(raw, excelRow, errors);
    if (!welder) continue;

    // Reflect the canonical plant ID back into the display cells.
    if (welder.plantWelderId) {
      normalized.welder_id = welder.plantWelderId;
    }

    const groupKey = welderGroupKey(welder);

    // A welder already in the org is fine — the qualification(s) on this row
    // will be attached to that welder at commit time. Only flag rows in this
    // same file that reuse a plant ID with conflicting non-blank welder details.
    const prior = welderByGroup.get(groupKey);
    if (prior) {
      if (weldersConflict(prior, welder)) {
        errors.push({
          excelRow,
          column: "welder_id",
          message: `Welder details conflict with another row for the same plant ID.`,
        });
      } else {
        welderByGroup.set(groupKey, mergeWelderSnapshot(prior, welder));
      }
    } else {
      welderByGroup.set(groupKey, welder);
    }

    const qualification = parseQualification(raw, excelRow, errors, warnings);
    rows.push({ excelRow, welder, qualification, raw: normalized });
  }

  const uniqueWelders = new Set(rows.map((r) => r.welder.plantWelderId));
  let existingWelderCount = 0;
  let newWelderCount = 0;
  for (const plantId of uniqueWelders) {
    if (existingPlantIds.has(plantId)) existingWelderCount += 1;
    else newWelderCount += 1;
  }
  const qualCount = rows.filter((r) => r.qualification).length;

  return {
    ok: errors.length === 0,
    rows,
    errors,
    warnings,
    summary: {
      totalRows: rows.length,
      welderCount: uniqueWelders.size,
      existingWelderCount,
      newWelderCount,
      qualificationCount: qualCount,
      errorCount: errors.length,
    },
  };
}

export function validateParsedImport(
  parsed: Array<{ excelRow: number; raw: RawImportRow }>,
  existingPlantIds: Iterable<string>,
  options: ImportValidationOptions = {},
): ImportValidationResult {
  return validateImportRows(parsed, new Set(existingPlantIds), options);
}
