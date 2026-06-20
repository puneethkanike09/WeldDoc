import type { FieldErrors } from "@/lib/field-errors";

export interface ReportRowDraft {
  key: string;
  welderId: string;
  materialGrade: string;
  dimensions: string;
  testThickness: string;
}

export function collectReportFormErrors(
  formData: FormData,
  rows: ReportRowDraft[],
): FieldErrors {
  const errors: FieldErrors = {};

  if (!formData.get("test_date")?.toString().trim()) {
    errors.test_date = "Test date is required.";
  }
  if (!formData.get("wps_no")?.toString().trim()) {
    errors.wps_no = "WPS number is required.";
  }

  const active = rows.filter((r) => r.welderId);
  if (active.length === 0) {
    errors.rows = "Add at least one welder to the report.";
  }

  for (const row of rows) {
    if (!row.welderId) continue;
    const prefix = `row_${row.key}`;
    if (!row.materialGrade.trim()) {
      errors[`${prefix}_materialGrade`] = "Material grade is required.";
    }
    if (!row.dimensions.trim()) {
      errors[`${prefix}_dimensions`] = "Dimensions are required.";
    }
    if (!row.testThickness.trim() || Number(row.testThickness) <= 0) {
      errors[`${prefix}_testThickness`] = "Test thickness is required.";
    }
  }

  return errors;
}

/** @deprecated Use collectReportFormErrors */
export function validateReportRows(rows: ReportRowDraft[]): string | null {
  const errors = collectReportFormErrors(new FormData(), rows);
  if (errors.rows) return errors.rows;
  const first = Object.values(errors)[0];
  return first ?? null;
}
