"use client";

import { IMPORT_COLUMNS, type ImportColumnKey } from "@/lib/welders/bulk-import/columns";
import { validatedRowToColumns } from "@/lib/welders/bulk-import/display";
import { ImportCellEditor } from "@/components/welders/import-cell-editor";
import type {
  ImportValidationError,
  ValidatedImportRow,
} from "@/lib/welders/bulk-import/types";

export function ImportPreviewTable({
  rows,
  errors,
  onCellChange,
}: {
  rows: ValidatedImportRow[];
  errors: ImportValidationError[];
  onCellChange: (
    excelRow: number,
    column: ImportColumnKey,
    value: string,
  ) => void;
}) {
  if (!rows.length) return null;

  const errorRows = new Set(errors.map((e) => e.excelRow));
  const errorCells = new Set(
    errors
      .filter((e) => e.column)
      .map((e) => `${e.excelRow}:${e.column}`),
  );

  return (
    <div>
      <h4 className="text-sm font-medium text-charcoal">Data preview</h4>
      <p className="mt-1 text-xs text-steel">
        Review and edit rows before importing. Employer and branch/site are
        applied from your organisation settings on import.
      </p>
      <div className="sleek-scroll mt-3 max-h-128 overflow-auto rounded-[10px] border border-silver">
        <table className="min-w-full text-left text-xs">
          <thead className="sticky top-0 z-10 bg-frost">
            <tr className="border-b border-silver text-[10px] uppercase tracking-wide text-steel">
              <th className="sticky left-0 z-20 bg-frost px-3 py-2 font-medium">
                #
              </th>
              {IMPORT_COLUMNS.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap px-2 py-2 font-medium"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const cells = validatedRowToColumns(row);
              const hasError = errorRows.has(row.excelRow);
              const rowBg = hasError ? "bg-expired/5" : "bg-panel";

              return (
                <tr
                  key={row.excelRow}
                  className={`border-b border-silver/60 last:border-0 ${
                    hasError ? "bg-expired/5" : ""
                  }`}
                >
                  <td
                    className={`sticky left-0 z-10 px-3 py-2 font-mono text-charcoal ${rowBg}`}
                  >
                    {row.excelRow}
                  </td>
                  {IMPORT_COLUMNS.map((col) => {
                    const value = cells[col];
                    const cellInvalid = errorCells.has(
                      `${row.excelRow}:${col}`,
                    );

                    return (
                      <td key={col} className="px-1.5 py-1.5 align-top">
                        <ImportCellEditor
                          column={col}
                          value={value}
                          rowCells={cells}
                          invalid={cellInvalid}
                          onChange={(next) =>
                            onCellChange(row.excelRow, col, next)
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
