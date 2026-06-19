import type { RevalidationMethod } from "@/types/db";

/**
 * EN ISO 9606-1 clause 9.3 revalidation methods (per client registry template):
 *  - 9.3a: validity 3 years (with 6-monthly employer confirmation)
 *  - 9.3b: validity 2 years, renewable +2 years on submitting reports
 *  - 9.3c: validity 6 months, renewable +6 months per validated report (unlimited)
 */
export const REVALIDATION_MONTHS: Record<RevalidationMethod, number> = {
  "9.3a": 36,
  "9.3b": 24,
  "9.3c": 6,
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function computeExpiry(
  method: RevalidationMethod,
  fromDate: string | Date,
): string {
  const base = typeof fromDate === "string" ? new Date(fromDate) : fromDate;
  return toISODate(addMonths(base, REVALIDATION_MONTHS[method]));
}

/** Extend an existing expiry by the method's interval (revalidation event). */
export function extendExpiry(
  method: RevalidationMethod,
  currentExpiry: string | Date,
): string {
  const base =
    typeof currentExpiry === "string"
      ? new Date(currentExpiry)
      : currentExpiry;
  return toISODate(addMonths(base, REVALIDATION_MONTHS[method]));
}

/** Continuity verification (clause 9.2) is on a 6-month cycle. */
export function continuityDue(lastVerified: string | null): string | null {
  if (!lastVerified) return null;
  return toISODate(addMonths(new Date(lastVerified), 6));
}
