"use client";

import { OPERATOR_TEMPLATE_COLUMNS } from "@/lib/operators/bulk-import/columns";
import { validatedRowToColumns } from "@/lib/operators/bulk-import/display";
import type {
  OperatorImportValidationError,
  ValidatedOperatorImportRow,
} from "@/lib/operators/bulk-import/types";

/**
 * Read-only preview of the parsed operator import. Cells that failed validation
 * are highlighted so the user can fix them in the Excel file and re-upload —
 * there is no in-grid editing.
 */
export function OperatorImportPreviewTable({
  rows,
  errors,
}: {
  rows: ValidatedOperatorImportRow[];
  errors: OperatorImportValidationError[];
}) {
  if (!rows.length) return null;

  const errorRows = new Set(errors.map((e) => e.excelRow));
  const errorCells = new Set(
    errors.filter((e) => e.column).map((e) => `${e.excelRow}:${e.column}`),
  );

  return (
    <div>
      <h4 className="text-sm font-medium text-charcoal">Data preview</h4>
      <p className="mt-1 text-xs text-steel">
        This is what will be imported. Rows highlighted in red have problems —
        fix them in your Excel file and upload again.
      </p>
      <div className="sleek-scroll mt-3 max-h-128 overflow-auto rounded-[10px] border border-silver">
        <table className="w-full min-w-max border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-frost">
            <tr>
              <th className="border-b border-r border-silver px-2 py-2 font-medium text-steel">
                Row
              </th>
              {OPERATOR_TEMPLATE_COLUMNS.map((col) => (
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
                  {OPERATOR_TEMPLATE_COLUMNS.map((col) => {
                    const invalid = errorCells.has(`${row.excelRow}:${col}`);
                    const value = cells[col];
                    return (
                      <td
                        key={col}
                        className={`whitespace-nowrap border-b border-r border-silver px-2 py-1.5 last:border-r-0 ${
                          invalid
                            ? "bg-ember/10 font-medium text-expired-ink"
                            : "text-charcoal"
                        }`}
                      >
                        {value || <span className="text-steel">—</span>}
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
