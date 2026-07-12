import { addPeriodFromISODate } from "@/lib/date-periods";
import type { OperatorRevalidationMethod } from "@/types/db";

const OPERATOR_REVALIDATION_MONTHS: Record<
  Exclude<OperatorRevalidationMethod, "6.3c">,
  number
> = {
  "6.3a": 72,
  "6.3b": 36,
};

const CONTINUITY_MONTHS = 6;

/** Initial operator certificate expiry — one day before anniversary. */
export function computeOperatorExpiry(
  issuedDate: string,
  method: OperatorRevalidationMethod,
): string | null {
  if (method === "6.3c") return null;
  const iso = issuedDate.includes("T") ? issuedDate.slice(0, 10) : issuedDate;
  return addPeriodFromISODate(iso, OPERATOR_REVALIDATION_MONTHS[method], true);
}

/** After revalidation — from revalidation date, no minus-one day. */
export function computeOperatorRevalidationExpiry(
  validatedOn: string,
  method: OperatorRevalidationMethod,
): string | null {
  if (method === "6.3a") return null;
  if (method === "6.3c") return null;
  const iso = validatedOn.includes("T") ? validatedOn.slice(0, 10) : validatedOn;
  return addPeriodFromISODate(iso, OPERATOR_REVALIDATION_MONTHS["6.3b"], false);
}

export function extendOperatorExpiry(
  validatedOn: string,
  method: OperatorRevalidationMethod,
): string | null {
  return computeOperatorRevalidationExpiry(validatedOn, method);
}

/** ISO 14732 clause 6.2 — 6-month continuity confirmation due date. */
export function operatorContinuityDue(
  lastVerified: string | null | undefined,
): string | null {
  if (!lastVerified) return null;
  const iso = lastVerified.includes("T") ? lastVerified.slice(0, 10) : lastVerified;
  return addPeriodFromISODate(iso, CONTINUITY_MONTHS, false);
}
