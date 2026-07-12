"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { Badge } from "@/components/ui/badge";
import { MasterListExportButton } from "@/components/masterlist/masterlist-export-button";
import { TableScrollArea } from "@/components/ui/table-scroll-area";
import { formatDate } from "@/lib/utils";
import {
  formatOperatorMasterRowExport,
  type OperatorMasterColumnKey,
  type OperatorMasterRow,
} from "@/lib/operator-masterlist";
import { WELDING_TYPES } from "@/lib/iso14732/constants";
import { Search } from "lucide-react";

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
  columns,
}: {
  rows: OperatorMasterRow[];
  columns: { key: OperatorMasterColumnKey; label: string }[];
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [weldingType, setWeldingType] = useState("all");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (
        term &&
        !r.operatorName.toLowerCase().includes(term) &&
        !r.operatorId.toLowerCase().includes(term) &&
        !r.process.toLowerCase().includes(term)
      )
        return false;
      if (status !== "all" && r.status !== status) return false;
      if (weldingType !== "all" && r.weldingType !== weldingType) return false;
      return true;
    });
  }, [rows, q, status, weldingType]);

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search operator, ID or process"
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="lg:w-40"
        >
          <option value="all">All statuses</option>
          <option value="Approved">Approved</option>
          <option value="Pending_NDT">Pending NDT</option>
          <option value="Draft">Draft</option>
          <option value="Expired">Expired</option>
          <option value="Failed">Failed</option>
        </Select>
        <Select
          value={weldingType}
          onChange={(e) => setWeldingType(e.target.value)}
          className="lg:w-40"
        >
          <option value="all">All welding types</option>
          {WELDING_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <div className="flex flex-wrap gap-2">
          <MasterListExportButton
            columns={columns}
            rows={filtered}
            filenamePrefix="operator-master-list"
            formatCell={(key, row, rowIndex) =>
              formatOperatorMasterRowExport(key, row, rowIndex)
            }
          />
        </div>
      </div>

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
            {filtered.map((r, i) => (
              <tr
                key={`${r.operatorId}-${i}`}
                className="border-b border-silver/60 last:border-0 hover:bg-frost/50"
              >
                {columns.map((c) => (
                  <td key={c.key} className={cellClassName(c.key)}>
                    {renderOperatorCell(c.key, r, i + 1)}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
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
      <p className="mt-3 text-sm text-steel">
        {filtered.length} of {rows.length} qualification records
      </p>
    </div>
  );
}
