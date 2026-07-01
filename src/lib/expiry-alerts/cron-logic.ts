import type { ExpiryDigestKind } from "@/lib/email";

const DAY = 1000 * 60 * 60 * 24;

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

export function orgDigestKind(
  welderCount: number,
  operatorCount: number,
): ExpiryDigestKind {
  if (welderCount > 0 && operatorCount > 0) return "mixed";
  if (operatorCount > 0) return "operator";
  return "welder";
}
