import { addPeriodFromISODate, parseISODate, formatISODate } from "@/lib/date-periods";
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

const CONTINUITY_MONTHS = 6;

/**
 * Initial certificate expiry from test / issue date.
 * Client rule: period ends one calendar day before the anniversary.
 */
export function computeExpiry(
  method: RevalidationMethod,
  fromDate: string | Date,
): string {
  const iso =
    typeof fromDate === "string" ? fromDate : formatISODate(parseISODate(fromDate));
  return addPeriodFromISODate(iso, REVALIDATION_MONTHS[method], true);
}

/**
 * Expiry after a revalidation event — counted from the revalidation date,
 * full calendar months (no minus-one day).
 */
export function computeRevalidationExpiry(
  method: RevalidationMethod,
  validatedOn: string,
): string {
  return addPeriodFromISODate(isoDateOnly(validatedOn), REVALIDATION_MONTHS[method], false);
}

/** @deprecated Prefer computeRevalidationExpiry — kept for call-site clarity. */
export function extendExpiry(
  method: RevalidationMethod,
  validatedOn: string | Date,
): string {
  const iso =
    typeof validatedOn === "string"
      ? isoDateOnly(validatedOn)
      : formatISODate(parseISODate(validatedOn));
  return computeRevalidationExpiry(method, iso);
}

/** Continuity verification (clause 9.2) — 6 months from last continuity or revalidation. */
export function continuityDue(lastVerified: string | null): string | null {
  if (!lastVerified) return null;
  return addPeriodFromISODate(isoDateOnly(lastVerified), CONTINUITY_MONTHS, false);
}

function isoDateOnly(value: string): string {
  return value.includes("T") ? value.slice(0, 10) : value;
}
