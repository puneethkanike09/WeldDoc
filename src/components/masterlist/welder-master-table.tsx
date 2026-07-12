"use client";

import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { MasterListExportButton } from "@/components/masterlist/masterlist-export-button";
import { WelderMasterListFilters } from "@/components/masterlist/master-list-filters";
import { RegistryListPagination } from "@/components/app/registry-list-pagination";
import { TableScrollArea } from "@/components/ui/table-scroll-area";
import { formatDate } from "@/lib/utils";
import {
  formatMasterRowExport,
  type MasterExportKey,
  type MasterRow,
} from "@/lib/masterlist";

function renderMasterCell(
  key: MasterExportKey,
  row: MasterRow,
  slNo: number,
) {
  if (key === "slNo") return slNo;
  if (key === "welderName") {
    return (
      <>
        {row.welderName}
        {row.isLegacy && (
          <Badge tone="outline" className="ml-1.5">
            Legacy
          </Badge>
        )}
      </>
    );
  }
  if (
    key === "testDate" ||
    key === "continuityExpiry" ||
    key === "revalidationExpiry"
  ) {
    return formatDate(row[key]);
  }
  if (key === "welderNo") {
    return <span className="font-mono text-[12px]">{row.welderNo}</span>;
  }
  return row[key] ?? "—";
}

function cellClassName(key: MasterExportKey): string {
  const base = "px-3 py-2.5";
  if (key === "slNo") return `${base} text-steel`;
  if (key === "welderName") return `${base} whitespace-nowrap font-medium text-onyx`;
  if (
    key === "process" ||
    key === "qualifiedDia" ||
    key === "qualifiedBwThk" ||
    key === "qualifiedFwThk" ||
    key === "testDate" ||
    key === "continuityExpiry" ||
    key === "revalidationExpiry"
  ) {
    return `${base} whitespace-nowrap`;
  }
  return base;
}

export function WelderMasterTable({
  rows,
  exportRows,
  columns,
  page,
  rowOffset,
  filteredCount,
  totalCount,
  q,
  status,
  joint,
}: {
  rows: MasterRow[];
  exportRows: MasterRow[];
  columns: { key: MasterExportKey; label: string }[];
  page: number;
  rowOffset: number;
  filteredCount: number;
  totalCount: number;
  q: string;
  status: string;
  joint: string;
}) {
  return (
    <div className="min-w-0">
      <WelderMasterListFilters
        basePath="/welders/masterlist"
        q={q}
        status={status}
        joint={joint}
        trailing={
          <MasterListExportButton
            columns={columns}
            rows={exportRows}
            filenamePrefix="welder-master-list"
            formatCell={(key, row, rowIndex) =>
              formatMasterRowExport(key, row, rowIndex)
            }
          />
        }
      />

      <TableScrollArea className="mt-5">
        <table className="w-full min-w-[960px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-silver bg-frost text-[11px] uppercase tracking-wide text-steel">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="whitespace-nowrap px-3 py-3 font-medium"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={`${r.welderNo}-${r.process}-${rowOffset + i}`}
                className="border-b border-silver/60 last:border-0 hover:bg-frost/50"
              >
                {columns.map((c) => (
                  <td key={c.key} className={cellClassName(c.key)}>
                    {renderMasterCell(c.key, r, rowOffset + i + 1)}
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
          basePath="/welders/masterlist"
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
