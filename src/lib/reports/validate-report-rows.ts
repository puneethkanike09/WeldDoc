export interface ReportRowDraft {
  welderId: string;
  materialGrade: string;
  dimensions: string;
  testThickness: string;
}

export function validateReportRows(rows: ReportRowDraft[]): string | null {
  const active = rows.filter((r) => r.welderId);
  if (active.length === 0) {
    return "Add at least one welder to the report.";
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.welderId) continue;
    const n = i + 1;
    if (!row.materialGrade.trim()) {
      return `Welder #${n}: material grade is required.`;
    }
    if (!row.dimensions.trim()) {
      return `Welder #${n}: dimensions are required.`;
    }
    if (!row.testThickness.trim() || Number(row.testThickness) <= 0) {
      return `Welder #${n}: test thickness is required.`;
    }
  }

  return null;
}
