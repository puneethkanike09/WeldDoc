import type { QualificationImportFields } from "./types";

export type ValidationImportRecord = {
  validatedOn: string;
  kind: "continuity" | "revalidation";
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime());
}

/** Split a history cell on semicolons or commas; trim and drop empties. */
export function splitHistoryDates(raw: string): string[] {
  return raw
    .split(/[;,]/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Parse one history column into sorted, unique ISO dates.
 * Pushes one error per invalid token.
 */
export function parseDateHistory(
  raw: string | null | undefined,
  column: string,
  excelRow: number,
  errors: Array<{ excelRow: number; column?: string; message: string }>,
): string[] {
  if (!raw?.trim()) return [];

  const parts = splitHistoryDates(raw);
  if (!parts.length) return [];

  const unique = new Set<string>();
  for (const part of parts) {
    if (!isValidIsoDate(part)) {
      errors.push({
        excelRow,
        column,
        message: `${column}: "${part}" must be YYYY-MM-DD.`,
      });
      continue;
    }
    unique.add(part);
  }

  return [...unique].sort();
}

/** Build validation log rows from parsed qualification history fields. */
export function collectValidationRecordsForImport(
  qual: Pick<
    QualificationImportFields,
    "continuityLastVerified" | "continuityHistory" | "revalidationHistory"
  >,
): ValidationImportRecord[] {
  const continuityDates = new Set<string>(qual.continuityHistory);
  if (qual.continuityLastVerified) {
    continuityDates.add(qual.continuityLastVerified);
  }

  const revalidationDates = new Set<string>(qual.revalidationHistory);

  const records: ValidationImportRecord[] = [
    ...[...continuityDates].sort().map(
      (validatedOn): ValidationImportRecord => ({
        validatedOn,
        kind: "continuity",
      }),
    ),
    ...[...revalidationDates].sort().map(
      (validatedOn): ValidationImportRecord => ({
        validatedOn,
        kind: "revalidation",
      }),
    ),
  ];

  return records;
}
