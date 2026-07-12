"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { Badge } from "@/components/ui/badge";
import { MasterListExportButton } from "@/components/masterlist/masterlist-export-button";
import { TableScrollArea } from "@/components/ui/table-scroll-area";
import { formatDate } from "@/lib/utils";
import {
  formatMasterRowExport,
  type MasterExportKey,
  type MasterRow,
} from "@/lib/masterlist";
import { matchesJointFilter } from "@/lib/masterlist/joint-filter";
import { Search } from "lucide-react";

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
  columns,
}: {
  rows: MasterRow[];
  columns: { key: MasterExportKey; label: string }[];
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [joint, setJoint] = useState<"all" | "BW" | "FW">("all");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (
        term &&
        !r.welderName.toLowerCase().includes(term) &&
        !r.welderNo.toLowerCase().includes(term) &&
        !r.process.toLowerCase().includes(term)
      )
        return false;
      if (status !== "all" && r.status !== status) return false;
      if (!matchesJointFilter(r.jointType, joint)) return false;
      return true;
    });
  }, [rows, q, status, joint]);

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search welder, ID or process"
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
          value={joint}
          onChange={(e) => setJoint(e.target.value as "all" | "BW" | "FW")}
          className="lg:w-36"
        >
          <option value="all">All joints</option>
          <option value="BW">Butt weld</option>
          <option value="FW">Fillet weld</option>
        </Select>
        <div className="flex flex-wrap gap-2">
          <MasterListExportButton
            columns={columns}
            rows={filtered}
            filenamePrefix="welder-master-list"
            formatCell={(key, row, rowIndex) =>
              formatMasterRowExport(key, row, rowIndex)
            }
          />
        </div>
      </div>

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
            {filtered.map((r, i) => (
              <tr
                key={`${r.welderNo}-${r.process}-${i}`}
                className="border-b border-silver/60 last:border-0 hover:bg-frost/50"
              >
                {columns.map((c) => (
                  <td key={c.key} className={cellClassName(c.key)}>
                    {renderMasterCell(c.key, r, i + 1)}
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
