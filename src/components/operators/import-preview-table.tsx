"use client";

import {
  OPERATOR_IMPORT_COLUMNS,
  type OperatorImportColumnKey,
} from "@/lib/operators/bulk-import/columns";
import { validatedRowToColumns } from "@/lib/operators/bulk-import/display";
import { OperatorImportCellEditor } from "@/components/operators/import-cell-editor";
import type {
  OperatorImportValidationError,
  ValidatedOperatorImportRow,
} from "@/lib/operators/bulk-import/types";

export function OperatorImportPreviewTable({
  rows,
  errors,
  onCellChange,
}: {
  rows: ValidatedOperatorImportRow[];
  errors: OperatorImportValidationError[];
  onCellChange: (
    excelRow: number,
    column: OperatorImportColumnKey,
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
        Review and edit rows before importing. Employer and branch are applied
        from your organisation settings on import.
      </p>
      <div className="sleek-scroll mt-3 max-h-128 overflow-auto rounded-[10px] border border-silver">
        <table className="w-full min-w-max border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-frost">
            <tr>
              <th className="border-b border-r border-silver px-2 py-2 font-medium text-steel">
                Row
              </th>
              {OPERATOR_IMPORT_COLUMNS.map((col) => (
                <th
                  key={col}
                  className="border-b border-r border-silver px-2 py-2 font-medium text-steel last:border-r-0"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const cells = validatedRowToColumns(row);
              const rowError = errorRows.has(row.excelRow);
              return (
                <tr
                  key={row.excelRow}
                  className={rowError ? "bg-ember/5" : "bg-panel"}
                >
                  <td className="border-b border-r border-silver px-2 py-1.5 font-mono text-steel">
                    {row.excelRow}
                  </td>
                  {OPERATOR_IMPORT_COLUMNS.map((col) => {
                    const cellKey = `${row.excelRow}:${col}`;
                    const invalid = errorCells.has(cellKey);
                    return (
                      <td
                        key={col}
                        className="border-b border-r border-silver p-1 last:border-r-0"
                      >
                        <OperatorImportCellEditor
                          column={col}
                          value={cells[col]}
                          invalid={invalid}
                          onChange={(value) =>
                            onCellChange(row.excelRow, col, value)
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
