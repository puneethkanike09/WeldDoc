/**
 * Lenient input coercion for the operator (ISO 14732) bulk-import grid.
 *
 * Mirrors the welder importer: real-world spreadsheets rarely use the exact
 * canonical codes, so we map common variants to what the validator + dropdowns
 * expect (labels, casing, British spelling, date formats, method numbers).
 * When a value can't be confidently mapped we keep the trimmed original so the
 * validator still flags it and the user sees what they typed.
 */

import {
  FUSION_JOINT_TYPES,
  FUSION_PRODUCT_TYPES,
  METHOD1_STANDARDS,
  QUALIFICATION_TEST_METHODS,
  RESISTANCE_JOINT_TYPES,
  RESISTANCE_PRODUCT_TYPES,
  WELDING_MODES,
  WELDING_TYPES,
} from "@/lib/iso14732/constants";
import {
  coerceDate,
  coerceNdt,
  coerceNumber,
  coerceProcess,
  coerceRevalidation,
  coerceStatus,
} from "@/lib/welders/bulk-import/normalize";
import {
  OPERATOR_IMPORT_COLUMNS,
  type OperatorImportColumnKey,
} from "./columns";
import type { RawOperatorImportRow } from "./types";

export {
  coerceDate,
  coerceNdt,
  coerceNumber,
  coerceProcess,
  coerceRevalidation,
  coerceStatus,
};

function toStr(value: string | number | null | undefined): string {
  if (value == null) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  return String(value).trim();
}

export function coerceWeldingType(value: string): string | null {
  const lower = value.trim().toLowerCase();
  if (!lower) return null;
  for (const t of WELDING_TYPES) {
    if (t.toLowerCase() === lower || lower.startsWith(t.toLowerCase())) return t;
  }
  return null;
}

export function coerceWeldingMode(value: string): string | null {
  const lower = value.trim().toLowerCase();
  if (!lower) return null;
  // British spelling + common abbreviations.
  if (lower.startsWith("mechani")) return "Mechanized";
  if (lower.startsWith("auto")) return "Automatic";
  for (const m of WELDING_MODES) {
    if (m.toLowerCase() === lower) return m;
  }
  return null;
}

const ALL_PRODUCT_TYPES = [
  ...new Set<string>([...FUSION_PRODUCT_TYPES, ...RESISTANCE_PRODUCT_TYPES]),
];

export function coerceProductType(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  const key = t.toLowerCase().replace(/\s+/g, " ");
  for (const p of ALL_PRODUCT_TYPES) {
    if (p.toLowerCase() === key) return p;
  }
  return null;
}

const ALL_JOINT_TYPES = [
  ...new Set<string>([...FUSION_JOINT_TYPES, ...RESISTANCE_JOINT_TYPES]),
];

export function coerceOperatorJoint(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  for (const j of ALL_JOINT_TYPES) {
    if (j.toLowerCase() === lower) return j;
  }
  // Fusion synonyms.
  if (/\bbw\b/.test(lower) || lower.includes("butt")) {
    if (!lower.includes("upset") && !lower.includes("flash")) return "BW";
  }
  if (/\bfw\b/.test(lower) || lower.includes("fillet")) return "FW";
  return null;
}

const QUAL_METHOD_CODES = new Set<string>(
  QUALIFICATION_TEST_METHODS.map((m) => m.code),
);

export function coerceQualMethod(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  if (QUAL_METHOD_CODES.has(t)) return t;
  const m = t.match(/[1-4]/);
  if (m) {
    const code = `Method_${m[0]}`;
    if (QUAL_METHOD_CODES.has(code)) return code;
  }
  return null;
}

export function coerceMethod1Standard(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  const key = t.toLowerCase().replace(/\s+/g, "");
  for (const s of METHOD1_STANDARDS) {
    if (s.toLowerCase().replace(/\s+/g, "") === key) return s;
  }
  return null;
}

type Coercer = (value: string) => string | null;

const COERCERS: Partial<Record<OperatorImportColumnKey, Coercer>> = {
  operator_status: coerceStatus,
  welding_type: coerceWeldingType,
  welding_mode: coerceWeldingMode,
  process: coerceProcess,
  product_type: coerceProductType,
  joint_type: coerceOperatorJoint,
  qualification_test_method: coerceQualMethod,
  method1_standard: coerceMethod1Standard,
  revalidation_method: (v) => coerceRevalidation(v, "6.3"),
  date_of_birth: coerceDate,
  date_of_welding: coerceDate,
  expiry_date: coerceDate,
  continuity_last_verified: coerceDate,
  result_vt: coerceNdt,
  result_mt_pt: coerceNdt,
  result_macro: coerceNdt,
  result_bend_or_macro: coerceNdt,
  result_fracture_macro: coerceNdt,
  result_rt_ut_bend: coerceNdt,
  result_ut_bend: coerceNdt,
};

export function normalizeOperatorImportCell(
  column: OperatorImportColumnKey,
  value: string | number | null | undefined,
): string {
  const s = toStr(value);
  if (s === "") return "";
  const coercer = COERCERS[column];
  if (!coercer) return s;
  return coercer(s) ?? s;
}

export function normalizeOperatorRawRow(
  raw: RawOperatorImportRow,
): Record<OperatorImportColumnKey, string> {
  const out = {} as Record<OperatorImportColumnKey, string>;
  for (const col of OPERATOR_IMPORT_COLUMNS) {
    out[col] = normalizeOperatorImportCell(col, raw[col] ?? null);
  }
  return out;
}
