"use client";

import { useCallback, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { Badge } from "@/components/ui/badge";
import { MasterListExportButton } from "@/components/masterlist/masterlist-export-button";
import { formatDate } from "@/lib/utils";
import {
  OPERATOR_MASTER_COLUMNS,
  type OperatorMasterRow,
} from "@/lib/operator-masterlist";
import { WELDING_TYPES } from "@/lib/iso14732/constants";
import { Search } from "lucide-react";

function formatOperatorExportCell(
  key: keyof OperatorMasterRow,
  row: OperatorMasterRow,
): string {
  if (key === "issued" || key === "expiry") {
    return formatDate(row[key] === "—" ? null : row[key]);
  }
  if (key === "status") {
    return row.status.replace("_", " ");
  }
  return String(row[key] ?? "");
}

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

export function OperatorMasterTable({ rows }: { rows: OperatorMasterRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [weldingType, setWeldingType] = useState("all");

  const formatCell = useCallback(formatOperatorExportCell, []);

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
            columns={OPERATOR_MASTER_COLUMNS}
            rows={filtered}
            filteredCount={filtered.length}
            totalCount={rows.length}
            filenamePrefix="operator-master-list"
            formatCell={formatCell}
          />
        </div>
      </div>

      <div className="mt-5 overflow-x-auto overflow-y-clip overscroll-y-auto rounded-[var(--radius-card)] border border-silver bg-panel">
        <table className="w-full min-w-[1200px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-silver bg-frost text-[11px] uppercase tracking-wide text-steel">
              {OPERATOR_MASTER_COLUMNS.map((c) => (
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
                <td className="whitespace-nowrap px-3 py-2.5 font-medium text-onyx">
                  {r.operatorName}
                  {r.isLegacy && (
                    <Badge tone="outline" className="ml-1.5">
                      Legacy
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2.5 font-mono text-[12px]">{r.operatorId}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.process}</td>
                <td className="px-3 py-2.5">{r.standard}</td>
                <td className="px-3 py-2.5">{r.weldingType}</td>
                <td className="px-3 py-2.5">{r.productType}</td>
                <td className="px-3 py-2.5">{r.jointType}</td>
                <td className="px-3 py-2.5">{r.weldingMode}</td>
                <td className="max-w-xs px-3 py-2.5 text-graphite">{r.rangeSummary}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>
                    {r.status.replace("_", " ")}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {formatDate(r.issued === "—" ? null : r.issued)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {formatDate(r.expiry === "—" ? null : r.expiry)}
                </td>
                <td className="px-3 py-2.5">{r.revalidation}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={OPERATOR_MASTER_COLUMNS.length}
                  className="px-3 py-12 text-center text-graphite"
                >
                  No qualifications match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-steel">
        {filtered.length} of {rows.length} qualification records
      </p>
    </div>
  );
}
