"use client";

import { useCallback, useEffect, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/sui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  buildMasterListCsv,
  downloadMasterListCsv,
  type MasterListColumn,
} from "@/lib/masterlist-export";

export function MasterListExportButton<
  T extends object,
  K extends string,
>({
  columns,
  rows,
  filteredCount,
  totalCount,
  filenamePrefix,
  formatCell,
}: {
  columns: readonly MasterListColumn<K>[];
  rows: T[];
  filteredCount: number;
  totalCount: number;
  filenamePrefix: string;
  formatCell: (key: K, row: T, rowIndex: number) => string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(columns.map((c) => c.key)),
  );

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(columns.map((c) => c.key)));
  }, [open, columns]);

  const toggleColumn = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(columns.map((c) => c.key)));
  }, [columns]);

  const clearAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const handleExport = useCallback(() => {
    const exportColumns = columns.filter((c) => selected.has(c.key));
    if (!exportColumns.length || !rows.length) return;

    const csv = buildMasterListCsv(rows, exportColumns, formatCell);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadMasterListCsv(csv, `${filenamePrefix}-${stamp}.csv`);
    setOpen(false);
  }, [columns, selected, rows, formatCell, filenamePrefix]);

  const filtersApplied = filteredCount !== totalCount;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
        <FileSpreadsheet className="h-4 w-4" /> Excel
      </Button>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Export to Excel</AlertDialogTitle>
          <AlertDialogDescription>
            {filtersApplied
              ? `Exporting ${filteredCount} of ${totalCount} rows matching your current filters.`
              : `Exporting all ${totalCount} rows.`}{" "}
            Choose which columns to include.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogBody>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-steel">
              {selected.size} of {columns.length} columns selected
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                className="font-medium text-ember hover:underline"
                onClick={selectAll}
              >
                Select all
              </button>
              <button
                type="button"
                className="font-medium text-steel hover:text-onyx hover:underline"
                onClick={clearAll}
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="mt-3 rounded-[10px] border border-silver p-3">
            <ul className="grid gap-2 sm:grid-cols-2">
              {columns.map((column) => {
                const checked = selected.has(column.key);
                return (
                  <li key={column.key}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-charcoal hover:bg-frost",
                        checked && "bg-frost/60",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleColumn(column.key)}
                        className="form-check"
                      />
                      {column.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </AlertDialogBody>

        <AlertDialogFooter>
          <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
          <Button
            type="button"
            disabled={selected.size === 0 || rows.length === 0}
            onClick={handleExport}
          >
            Export {filteredCount} row{filteredCount === 1 ? "" : "s"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
