import type { OperatorRevalidationMethod } from "@/types/db";

const MONTH = 30 * 24 * 60 * 60 * 1000;

export function computeOperatorExpiry(
  issuedDate: string,
  method: OperatorRevalidationMethod,
): string | null {
  const base = new Date(issuedDate.includes("T") ? issuedDate : `${issuedDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return null;

  if (method === "6.3c") return null;

  const months = method === "6.3a" ? 72 : 36;
  const expiry = new Date(base.getTime() + months * MONTH);
  return expiry.toISOString().slice(0, 10);
}

export function extendOperatorExpiry(
  currentExpiry: string | null,
  method: OperatorRevalidationMethod,
): string | null {
  if (method === "6.3a") return currentExpiry;
  if (method === "6.3c") return null;
  const base = currentExpiry
    ? new Date(currentExpiry.includes("T") ? currentExpiry : `${currentExpiry}T00:00:00`)
    : new Date();
  if (Number.isNaN(base.getTime())) return null;
  const expiry = new Date(base.getTime() + 36 * MONTH);
  return expiry.toISOString().slice(0, 10);
}

/** ISO 14732 clause 6.2 — 6-month continuity confirmation due date. */
export function operatorContinuityDue(
  lastVerified: string | null | undefined,
): string | null {
  if (!lastVerified) return null;
  const base = new Date(
    lastVerified.includes("T") ? lastVerified : `${lastVerified}T00:00:00`,
  );
  if (Number.isNaN(base.getTime())) return null;
  const due = new Date(base.getTime() + 6 * MONTH);
  return due.toISOString().slice(0, 10);
}
