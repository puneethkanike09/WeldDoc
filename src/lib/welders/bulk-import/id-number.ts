/** Format Excel numeric ID cells without scientific notation. */
export function formatIdNumberValue(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value).toLocaleString("fullwide", {
      useGrouping: false,
      maximumFractionDigits: 0,
    });
  }
  return coerceIdNumberString(String(value).trim());
}

/** Parse id_number from a worksheet cell (prefers raw numeric value). */
export function idNumberFromWorksheetCell(
  cell: { t?: string; v?: unknown; w?: string } | undefined,
): string | null {
  if (!cell || cell.v == null || cell.v === "") return null;
  if (cell.t === "n" && typeof cell.v === "number") {
    return formatIdNumberValue(cell.v);
  }
  if (typeof cell.v === "string") {
    return coerceIdNumberString(cell.v.trim());
  }
  return formatIdNumberValue(cell.v);
}

/** Coerce display strings including Excel scientific notation (e.g. 1.23E+11). */
export function coerceIdNumberString(value: string): string | null {
  if (!value) return null;
  if (/^\d+$/.test(value)) return value;
  if (/^[\d.]+e[+]?-?\d+$/i.test(value)) {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return Math.round(n).toLocaleString("fullwide", {
        useGrouping: false,
        maximumFractionDigits: 0,
      });
    }
  }
  return value;
}
