import type { NdtDtRecord, QualificationRecord, ValidationRecord } from "@/types/db";
import { REVALIDATION_MONTHS } from "@/lib/expiry";

export interface CertTableRow {
  date: string;
  signature: string;
  position: string;
}

function fmt(d: string | null): string {
  if (!d) return "";
  const date = new Date(d.includes("T") ? d : `${d}T00:00:00`);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function testingStandardLabel(wpq: QualificationRecord): string {
  return wpq.testing_standard ?? "EN ISO 9606-1:2017";
}

export function continuityRows(
  validations: ValidationRecord[],
  maxRows = 6,
): CertTableRow[] {
  return validations
    .filter((v) => v.kind === "continuity")
    .sort(
      (a, b) =>
        new Date(a.validated_on).getTime() - new Date(b.validated_on).getTime(),
    )
    .slice(-maxRows)
    .map((v) => ({
      date: fmt(v.validated_on),
      signature: v.validator_name ?? "Confirmed",
      position: "Welding coordinator / manufacturer",
    }));
}

export function examinerRevalidationRows(
  validations: ValidationRecord[],
  maxRows = 3,
): CertTableRow[] {
  return validations
    .filter((v) => v.kind === "revalidation")
    .sort(
      (a, b) =>
        new Date(a.validated_on).getTime() - new Date(b.validated_on).getTime(),
    )
    .slice(-maxRows)
    .map((v) => ({
      date: fmt(v.validated_on),
      signature: v.validator_name ?? "Examiner",
      position: "Examining body",
    }));
}

export function revalidationTitle(method: QualificationRecord["revalidation_method"]): string {
  switch (method) {
    case "9.3a":
      return "Revalidation of qualification (9.3a) — validity 3 years";
    case "9.3b":
      return "Revalidation by examiner / examining body (9.3b) — 2 years (+2 on renewal)";
    case "9.3c":
      return "Revalidation (9.3c) — 6-month cycles under ISO 3834 quality system";
    default:
      return "Revalidation of qualification";
  }
}

export function revalidationNote(method: QualificationRecord["revalidation_method"]): string {
  switch (method) {
    case "9.3a":
      return "Valid until date applies to the initial 3-year period. Six-month employer confirmation (9.2) required throughout.";
    case "9.3b":
      return "After 2 years, submit reports to the examining body for a further 2-year extension (up to 4 years total).";
    case "9.3c":
      return "Six-month validation reports extend approval while the ISO 3834 quality system remains certified.";
    default:
      return "";
  }
}

export function initialValidUntil(
  wpq: QualificationRecord,
): string {
  if (wpq.expiry_date) return fmt(wpq.expiry_date);
  if (!wpq.certificate_issued_date && !wpq.date_of_welding) return "";
  const base = wpq.certificate_issued_date ?? wpq.date_of_welding!;
  const months = REVALIDATION_MONTHS[wpq.revalidation_method];
  const d = new Date(base.includes("T") ? base : `${base}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return fmt(d.toISOString().slice(0, 10));
}

export function annexTestResult(
  ndt: NdtDtRecord[],
  methods: readonly string[],
): { performed: string; notTested: boolean; reportRef: string } {
  const rec = ndt.find((n) => methods.includes(n.test_method));
  if (!rec) return { performed: "", notTested: true, reportRef: "" };
  const reportRef = rec.conducted_by ?? "";
  if (rec.result === "Pass") {
    return {
      performed: reportRef || "Accepted",
      notTested: false,
      reportRef,
    };
  }
  if (rec.result === "Fail") {
    return { performed: "Fail", notTested: false, reportRef };
  }
  return { performed: "", notTested: true, reportRef: "" };
}

export function formatDimensions(wpq: QualificationRecord): string {
  if (wpq.dimensions) return wpq.dimensions;
  const t = wpq.dimension_thickness_mm;
  const w = wpq.dimension_width_mm;
  const l = wpq.dimension_length_mm;
  if (t != null && w != null && l != null) {
    return `${t}mm(T)×${w}mm(W)×${l}mm(L)`;
  }
  if (wpq.test_thickness_mm != null) return `${wpq.test_thickness_mm} mm`;
  return "—";
}

export function materialOneText(wpq: QualificationRecord): string {
  const parts = [
    wpq.material_specification,
    wpq.material_grade,
    wpq.base_material_group ? `Group ${wpq.base_material_group}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

export function materialTwoText(wpq: QualificationRecord): string {
  const parts = [
    wpq.material2_specification,
    wpq.material2_grade,
    wpq.material2_group ? `Group ${wpq.material2_group}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "NA";
}
