export interface MasterListColumn<T extends string = string> {
  key: T;
  label: string;
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function buildMasterListCsv<T extends object, K extends string>(
  rows: T[],
  columns: readonly MasterListColumn<K>[],
  formatCell: (key: K, row: T, rowIndex: number) => string,
): string {
  const header = columns.map((c) => csvEscape(c.label)).join(",");
  const body = rows
    .map((row, rowIndex) =>
      columns
        .map((c) => csvEscape(formatCell(c.key, row, rowIndex + 1)))
        .join(","),
    )
    .join("\n");
  return `\uFEFF${header}\n${body}`;
}

export function downloadMasterListCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
