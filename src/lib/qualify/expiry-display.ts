import type { QualListItem } from "@/components/qualify/qualification-sidebar";

/** e.g. "today", "in 1 day", "in 14 days" */
export function relativeDueInLabel(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}

/** Compact list hint: "today", "1d", "14d" */
export function relativeDueCompact(days: number): string {
  if (days === 0) return "today";
  return `${days}d`;
}

export function isCertificateExpired(
  statusTone: QualListItem["statusTone"],
  daysToExpiry: number | null,
): boolean {
  return statusTone === "expired" || (daysToExpiry !== null && daysToExpiry < 0);
}

export function certificateExpiryHeading(
  statusTone: QualListItem["statusTone"],
  daysToExpiry: number | null,
): string {
  return isCertificateExpired(statusTone, daysToExpiry)
    ? "Certificate expired on"
    : "Certificate expires";
}

export function continuityExpiryHeading(daysToContinuityDue: number | null): string {
  if (daysToContinuityDue !== null && daysToContinuityDue < 0) {
    return "Continuity overdue";
  }
  return "Continuity due";
}

export function continuityExpiryTone(
  daysToContinuityDue: number | null,
): "warning" | "danger" | "normal" {
  if (daysToContinuityDue === null) return "normal";
  if (daysToContinuityDue < 0) return "danger";
  if (daysToContinuityDue <= 60) return "warning";
  return "normal";
}
