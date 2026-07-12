"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { Badge } from "@/components/ui/badge";
import { MasterListExportButton } from "@/components/masterlist/masterlist-export-button";
import { TableScrollArea } from "@/components/ui/table-scroll-area";
import { formatDate } from "@/lib/utils";
import {
  MASTER_COLUMNS,
  MASTER_EXPORT_COLUMNS,
  formatMasterRowExport,
  type MasterExportKey,
  type MasterRow,
} from "@/lib/masterlist";
import { matchesJointFilter } from "@/lib/masterlist/joint-filter";
import { Search } from "lucide-react";

export function WelderMasterTable({ rows }: { rows: MasterRow[] }) {
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
            columns={MASTER_EXPORT_COLUMNS}
            rows={filtered}
            filteredCount={filtered.length}
            totalCount={rows.length}
            filenamePrefix="welder-master-list"
            formatCell={(key, row, rowIndex) =>
              formatMasterRowExport(key as MasterExportKey, row, rowIndex)
            }
          />
        </div>
      </div>

      <TableScrollArea className="mt-5">
        <table className="w-full min-w-[1600px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-silver bg-frost text-[11px] uppercase tracking-wide text-steel">
              <th className="whitespace-nowrap px-3 py-3 font-medium">SL. NO.</th>
              {MASTER_COLUMNS.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-3 py-3 font-medium">
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
                <td className="px-3 py-2.5 text-steel">{i + 1}</td>
                <td className="whitespace-nowrap px-3 py-2.5 font-medium text-onyx">
                  {r.welderName}
                  {r.isLegacy && (
                    <Badge tone="outline" className="ml-1.5">
                      Legacy
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2.5 font-mono text-[12px]">{r.welderNo}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.process}</td>
                <td className="px-3 py-2.5">{r.jointType}</td>
                <td className="px-3 py-2.5">{r.actualBwPosition}</td>
                <td className="px-3 py-2.5">{r.actualFwPosition}</td>
                <td className="px-3 py-2.5">{r.qualifiedBwPosition}</td>
                <td className="px-3 py-2.5">{r.qualifiedFwPosition}</td>
                <td className="px-3 py-2.5">{r.fmGroup}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.qualifiedDia}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.qualifiedBwThk}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.qualifiedFwThk}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {formatDate(r.testDate)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {formatDate(r.continuityExpiry)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {formatDate(r.revalidationExpiry)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={MASTER_COLUMNS.length + 1}
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
