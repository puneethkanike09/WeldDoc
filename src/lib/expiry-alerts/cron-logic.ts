import type { ExpiryDigestKind } from "@/lib/email";
import type { AlertEmailFrequency } from "@/types/db";

const DAY = 1000 * 60 * 60 * 24;

export const ORG_DIGEST_ALERT_TYPE = "org-digest";

export function daysUntil(date: string, now = Date.now()): number {
  return Math.ceil((new Date(date).getTime() - now) / DAY);
}

export function bucketFor(daysLeft: number, leadDays: number[]): string | null {
  if (daysLeft < 0) return "overdue";
  const sorted = [...leadDays].sort((a, b) => a - b);
  for (const lead of sorted) {
    if (daysLeft <= lead) return `d${lead}`;
  }
  return null;
}

/** Qual is within any configured lead window (or overdue). */
export function inLeadWindow(daysLeft: number, leadDays: number[]): boolean {
  if (daysLeft < 0) return true;
  const maxLead = Math.max(...leadDays, 0);
  return daysLeft <= maxLead;
}

export function orgDigestKind(
  welderCount: number,
  operatorCount: number,
): ExpiryDigestKind {
  if (welderCount > 0 && operatorCount > 0) return "mixed";
  if (operatorCount > 0) return "operator";
  return "welder";
}

export function normalizeFrequency(
  raw: string | null | undefined,
): AlertEmailFrequency {
  const v = raw?.trim();
  const allowed: AlertEmailFrequency[] = [
    "once",
    "daily",
    "every_2_days",
    "weekly",
    "twice_weekly",
    "every_3_weeks",
  ];
  if (v && allowed.includes(v as AlertEmailFrequency)) {
    return v as AlertEmailFrequency;
  }
  return "once";
}
