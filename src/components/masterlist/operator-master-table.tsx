"use client";

import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { MasterListExportButton } from "@/components/masterlist/masterlist-export-button";
import { OperatorMasterListFilters } from "@/components/masterlist/master-list-filters";
import { RegistryListPagination } from "@/components/app/registry-list-pagination";
import { TableScrollArea } from "@/components/ui/table-scroll-area";
import { formatDate } from "@/lib/utils";
import {
  formatOperatorMasterRowExport,
  type OperatorMasterColumnKey,
  type OperatorMasterRow,
} from "@/lib/operator-masterlist";

const STATUS_TONE: Record<
  string,
  "active" | "expiring" | "expired" | "neutral" | "sapphire"
> = {
  Approved: "active",
  Draft: "neutral",
  Pending_NDT: "sapphire",
  Failed: "expired",
  Expired: "expired",
  Superseded: "neutral",
};

function renderOperatorCell(
  key: OperatorMasterColumnKey,
  row: OperatorMasterRow,
  slNo: number,
) {
  if (key === "slNo") return slNo;
  if (key === "operatorName") {
    return (
      <>
        {row.operatorName}
        {row.isLegacy && (
          <Badge tone="outline" className="ml-1.5">
            Legacy
          </Badge>
        )}
      </>
    );
  }
  if (key === "operatorId") {
    return <span className="font-mono text-[12px]">{row.operatorId}</span>;
  }
  if (key === "rangeSummary") {
    return <span className="text-graphite">{row.rangeSummary}</span>;
  }
  if (key === "status") {
    return (
      <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>
        {row.status.replace("_", " ")}
      </Badge>
    );
  }
  if (key === "issued" || key === "expiry") {
    return formatDate(row[key] === "—" ? null : row[key]);
  }
  return row[key] ?? "—";
}

function cellClassName(key: OperatorMasterColumnKey): string {
  const base = "px-3 py-2.5";
  if (key === "slNo") return `${base} text-steel`;
  if (key === "operatorName") return `${base} whitespace-nowrap font-medium text-onyx`;
  if (
    key === "process" ||
    key === "issued" ||
    key === "expiry" ||
    key === "rangeSummary"
  ) {
    return key === "rangeSummary" ? `${base} max-w-xs` : `${base} whitespace-nowrap`;
  }
  return base;
}

export function OperatorMasterTable({
  rows,
  exportRows,
  columns,
  page,
  rowOffset,
  filteredCount,
  totalCount,
  q,
  status,
  weldingType,
  weldingTypeOptions,
}: {
  rows: OperatorMasterRow[];
  exportRows: OperatorMasterRow[];
  columns: { key: OperatorMasterColumnKey; label: string }[];
  page: number;
  rowOffset: number;
  filteredCount: number;
  totalCount: number;
  q: string;
  status: string;
  weldingType: string;
  weldingTypeOptions: string[];
}) {
  return (
    <div className="min-w-0">
      <OperatorMasterListFilters
        basePath="/operators/masterlist"
        q={q}
        status={status}
        weldingType={weldingType}
        weldingTypeOptions={weldingTypeOptions}
        trailing={
          <MasterListExportButton
            columns={columns}
            rows={exportRows}
            filenamePrefix="operator-master-list"
            formatCell={(key, row, rowIndex) =>
              formatOperatorMasterRowExport(key, row, rowIndex)
            }
          />
        }
      />

      <TableScrollArea className="mt-5">
        <table className="w-full min-w-[960px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-silver bg-frost text-[11px] uppercase tracking-wide text-steel">
              {columns.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-3 py-3 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={`${r.operatorId}-${rowOffset + i}`}
                className="border-b border-silver/60 last:border-0 hover:bg-frost/50"
              >
                {columns.map((c) => (
                  <td key={c.key} className={cellClassName(c.key)}>
                    {renderOperatorCell(c.key, r, rowOffset + i + 1)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-3 py-12 text-center text-graphite"
                >
                  No qualifications match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableScrollArea>

      <Suspense fallback={null}>
        <RegistryListPagination
          basePath="/operators/masterlist"
          page={page}
          totalCount={filteredCount}
          entityLabel="qualification records"
        />
      </Suspense>

      {filteredCount <= 10 ? (
        <p className="mt-3 text-sm text-steel">
          {filteredCount} of {totalCount} qualification records
          {filteredCount !== totalCount ? " matching your filters" : ""}
        </p>
      ) : null}
    </div>
  );
}
