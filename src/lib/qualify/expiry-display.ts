import type { QualListItem } from "@/components/qualify/qualification-sidebar";

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
