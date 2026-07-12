"use client";

import { useCallback } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  filenamePrefix,
  formatCell,
}: {
  columns: readonly MasterListColumn<K>[];
  rows: T[];
  filenamePrefix: string;
  formatCell: (key: K, row: T, rowIndex: number) => string;
}) {
  const handleExport = useCallback(() => {
    if (!columns.length || !rows.length) return;
    const csv = buildMasterListCsv(rows, columns, formatCell);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadMasterListCsv(csv, `${filenamePrefix}-${stamp}.csv`);
  }, [columns, rows, formatCell, filenamePrefix]);

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={!columns.length || !rows.length}
      onClick={handleExport}
    >
      <FileSpreadsheet className="h-4 w-4" /> Excel
    </Button>
  );
}
