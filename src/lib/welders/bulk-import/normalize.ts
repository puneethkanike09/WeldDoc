/**
 * Lenient input coercion for the welder bulk-import grid.
 *
 * Legacy spreadsheets rarely use the exact canonical codes the validator
 * expects. Rather than flag every reasonable variant as an error, we coerce
 * common representations to the canonical value the app stores:
 *   - process:  "MAG (135)", "135 — MAG / GMAW", "SMAW", "135"      -> "135"
 *   - joint:    "Butt", "Butt weld (BW)", "bw"                       -> "BW"
 *   - position: "pa", "PA — flat", "h-l045"                          -> "PA" / "H-L045"
 *   - status:   "active"                                             -> "Active"
 *   - reval:    "9.3B", "6.3b", "3b", "b"                            -> "9.3b"
 *   - dates:    "15/06/2024", "15.06.2024", "10 May 2023", 45292      -> "2024-06-15"
 *   - numbers:  "12 mm", "12mm"                                       -> "12"
 *
 * When a value cannot be confidently mapped we return the trimmed original so
 * the validator still flags it (and the user sees exactly what they typed).
 */

import {
  BW_POSITIONS,
  FILLER_GROUPS,
  FW_POSITIONS,
  JOINT_TYPES,
  MATERIAL_GROUPS,
  PRODUCT_TYPES,
  TESTING_STANDARDS,
  WELDING_PROCESSES,
} from "@/lib/iso9606/constants";
import { IMPORT_COLUMNS, type ImportColumnKey } from "./columns";
import { coerceIdNumberString } from "./id-number";
import type { RawImportRow } from "./types";

function toStr(value: string | number | null | undefined): string {
  if (value == null) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  return String(value).trim();
}

const PROCESS_CODES = new Set<string>(WELDING_PROCESSES.map((p) => p.code));

// Common AWS / colloquial process abbreviations mapped to ISO 4063 codes.
const PROCESS_ALIASES: Record<string, string> = {
  smaw: "111",
  mma: "111",
  mmaw: "111",
  saw: "121",
  mig: "131",
  migw: "131",
  mag: "135",
  gmaw: "135",
  fcaw: "136",
  "fcaw-g": "136",
  "fcaw-s": "114",
  tig: "141",
  gtaw: "141",
  paw: "15",
  plasma: "15",
  oaw: "311",
  oxy: "311",
  "oxy-acetylene": "311",
  gas: "311",
};

export function coerceProcess(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  if (PROCESS_CODES.has(t)) return t;

  // Any numeric token that matches a known ISO code, e.g. "MAG (135)".
  for (const token of t.match(/\d+/g) ?? []) {
    if (PROCESS_CODES.has(token)) return token;
  }

  const lower = t.toLowerCase();
  // Full ISO name match, e.g. "MAG / GMAW (metal active gas)".
  for (const p of WELDING_PROCESSES) {
    if (p.name.toLowerCase() === lower) return p.code;
  }
  // Alias / abbreviation match on any alpha token.
  for (const token of lower.match(/[a-z][a-z-]*/g) ?? []) {
    if (PROCESS_ALIASES[token]) return PROCESS_ALIASES[token];
  }
  return null;
}

const JOINT_CODES = new Set<string>(JOINT_TYPES.map((j) => j.code));

export function coerceJoint(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  if (JOINT_CODES.has(t)) return t;
  const lower = t.toLowerCase();
  if (/\bbw\b/.test(lower) || lower.includes("butt")) return "BW";
  if (/\bfw\b/.test(lower) || lower.includes("fillet")) return "FW";
  return null;
}

const POSITION_CODES = [...new Set([...BW_POSITIONS, ...FW_POSITIONS])];

export function coercePosition(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  const upper = t.toUpperCase();
  // Leading token before a space or em/en dash: "PA — flat" -> "PA".
  const candidate = t.split(/\s|—|–/)[0].toUpperCase();
  for (const code of POSITION_CODES) {
    const cu = code.toUpperCase();
    if (upper === cu || candidate === cu) return code;
  }
  return null;
}

const MATERIAL_CODES = new Set<string>(MATERIAL_GROUPS.map((m) => m.code));

export function coerceMaterialGroup(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  if (MATERIAL_CODES.has(t)) return t;
  const m = t.match(/\d+/);
  if (m && MATERIAL_CODES.has(m[0])) return m[0];
  return null;
}

const FILLER_CODES = new Set<string>(FILLER_GROUPS.map((f) => f.code));

export function coerceFiller(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  if (FILLER_CODES.has(t)) return t;
  const m = t.match(/fm\s*([1-6])/i);
  if (m) {
    const code = `FM${m[1]}`;
    if (FILLER_CODES.has(code)) return code;
  }
  return null;
}

export function coerceProduct(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  for (const p of PRODUCT_TYPES) {
    if (p.toLowerCase() === lower) return p;
  }
  return null;
}

const WELDER_STATUSES = ["Active", "Inactive", "Suspended"] as const;

export function coerceStatus(value: string): string | null {
  const lower = value.trim().toLowerCase();
  if (!lower) return null;
  for (const s of WELDER_STATUSES) {
    if (s.toLowerCase() === lower) return s;
  }
  return null;
}

/**
 * Coerce a revalidation-method cell to `${prefix}a|b|c`. Accepts the wrong
 * numeric prefix (e.g. operator `6.3b` typed on a welder sheet), the bare
 * clause letter, and any casing.
 */
export function coerceRevalidation(value: string, prefix: string): string | null {
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, "");
  if (!cleaned) return null;
  const m = cleaned.match(/(?:^|[.\d])([abc])$/) ?? cleaned.match(/^([abc])$/);
  if (m) return `${prefix}${m[1]}`;
  return null;
}

const NDT_SENTINEL_NA = new Set(["", "-", "--", "n/a", "na", "none", "nil", "n.a.", "not tested"]);

export function coerceNdt(value: string): string | null {
  const lower = value.trim().toLowerCase();
  if (lower === "pass" || lower === "p" || lower === "passed" || lower === "ok" || lower === "accept" || lower === "accepted") {
    return "Pass";
  }
  if (lower === "fail" || lower === "f" || lower === "failed" || lower === "reject" || lower === "rejected") {
    return "Fail";
  }
  if (NDT_SENTINEL_NA.has(lower)) return "NA";
  return null;
}

const TESTING_CODES = TESTING_STANDARDS.map((s) => s.code);

export function coerceTestingStandard(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  const key = t.toLowerCase().replace(/\s+/g, "");
  for (const code of TESTING_CODES) {
    if (code.toLowerCase().replace(/\s+/g, "") === key) return code;
  }
  return null;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function iso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Coerce a wide range of date encodings to `YYYY-MM-DD`, else null. */
export function coerceDate(value: string): string | null {
  const t = value.trim();
  if (!t) return null;

  // Already ISO.
  const isoMatch = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return iso(+isoMatch[1], +isoMatch[2], +isoMatch[3]);
  }

  // Excel serial date number (days since 1899-12-30).
  if (/^\d{4,6}$/.test(t)) {
    const serial = Number(t);
    if (serial >= 20000 && serial <= 60000) {
      const ms = Date.UTC(1899, 11, 30) + serial * 86400000;
      const dt = new Date(ms);
      return iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
    }
  }

  // Numeric with separators: d/m/y, d-m-y, d.m.y (and y/m/d).
  const parts = t.split(/[/.\-]/).map((p) => p.trim());
  if (parts.length === 3 && parts.every((p) => /^\d+$/.test(p))) {
    let [a, b, c] = parts.map(Number);
    // Year-first: YYYY/MM/DD.
    if (parts[0].length === 4) {
      return iso(a, b, c);
    }
    // Two-digit year -> 20xx / 19xx.
    if (parts[2].length <= 2) {
      c = c >= 70 ? 1900 + c : 2000 + c;
    }
    // Day-first is the default; swap to month-first only if unambiguous.
    let day = a;
    let month = b;
    if (a > 12 && b <= 12) {
      day = a;
      month = b;
    } else if (b > 12 && a <= 12) {
      day = b;
      month = a;
    }
    return iso(c, month, day);
  }

  // Textual month: "10 May 2023", "May 10, 2023", "10-May-2023".
  const tokens = t.toLowerCase().replace(/,/g, " ").split(/[\s\-/]+/).filter(Boolean);
  if (tokens.length === 3) {
    const monthTok = tokens.find((tok) => MONTHS[tok.slice(0, 3)]);
    if (monthTok) {
      const month = MONTHS[monthTok.slice(0, 3)];
      const nums = tokens.filter((tok) => /^\d+$/.test(tok)).map(Number);
      if (nums.length === 2) {
        const year = nums.find((n) => n > 31);
        const day = nums.find((n) => n <= 31 && n !== year);
        if (year && day) return iso(year, month, day);
      }
    }
  }

  return null;
}

/** Strip units/spaces from a numeric cell: "12 mm" -> "12", "1,5" -> "1.5". */
export function coerceNumber(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  const cleaned = t.replace(/,/g, ".");
  const m = cleaned.match(/-?\d+(?:\.\d+)?/);
  return m ? m[0] : null;
}

type Coercer = (value: string) => string | null;

/** Coerce semicolon- or comma-separated dates to canonical ISO list. */
export function coerceDateHistory(value: string): string | null {
  const parts = value
    .split(/[;,]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return null;

  const out: string[] = [];
  for (const part of parts) {
    const d = coerceDate(part);
    if (!d) return null;
    out.push(d);
  }
  return out.join(";");
}

const COERCERS: Partial<Record<ImportColumnKey, Coercer>> = {
  welder_status: coerceStatus,
  id_number: (v) => coerceIdNumberString(v),
  process: coerceProcess,
  joint_type: coerceJoint,
  position: coercePosition,
  base_material_group: coerceMaterialGroup,
  filler_group: coerceFiller,
  product: coerceProduct,
  testing_standard: coerceTestingStandard,
  revalidation_method: (v) => coerceRevalidation(v, "9.3"),
  test_thickness_mm: coerceNumber,
  deposited_thickness_mm: coerceNumber,
  pipe_od_mm: coerceNumber,
  date_of_birth: coerceDate,
  date_of_welding: coerceDate,
  expiry_date: coerceDate,
  continuity_last_verified: coerceDate,
  continuity_history: coerceDateHistory,
  revalidation_history: coerceDateHistory,
  result_vt: coerceNdt,
  result_rt_ut: coerceNdt,
  result_fracture: coerceNdt,
};

/** Normalize a single cell; falls back to the trimmed original when unmapped. */
export function normalizeImportCell(
  column: ImportColumnKey,
  value: string | number | null | undefined,
): string {
  const s = toStr(value);
  if (s === "") return "";
  const coercer = COERCERS[column];
  if (!coercer) return s;
  return coercer(s) ?? s;
}

/** Produce a full, normalized column map for one raw Excel row. */
export function normalizeRawRow(
  raw: RawImportRow,
): Record<ImportColumnKey, string> {
  const out = {} as Record<ImportColumnKey, string>;
  for (const col of IMPORT_COLUMNS) {
    out[col] = normalizeImportCell(col, raw[col] ?? null);
  }
  return out;
}
