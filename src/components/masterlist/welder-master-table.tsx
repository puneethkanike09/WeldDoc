"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { MASTER_COLUMNS, type MasterRow } from "@/lib/masterlist";
import { Search, FileSpreadsheet } from "lucide-react";

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

export function WelderMasterTable({ rows }: { rows: MasterRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [joint, setJoint] = useState("all");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (
        term &&
        !r.welderName.toLowerCase().includes(term) &&
        !r.uid.toLowerCase().includes(term) &&
        !r.welderId.toLowerCase().includes(term) &&
        !r.process.toLowerCase().includes(term)
      )
        return false;
      if (status !== "all" && r.status !== status) return false;
      if (joint !== "all" && r.jointType !== joint) return false;
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
            placeholder="Search welder, UID or process"
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
          onChange={(e) => setJoint(e.target.value)}
          className="lg:w-36"
        >
          <option value="all">All joints</option>
          <option value="BW">Butt weld</option>
          <option value="FW">Fillet weld</option>
        </Select>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/api/welders/masterlist/export?format=csv">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </ButtonLink>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto overflow-y-clip overscroll-y-auto rounded-[var(--radius-card)] border border-silver bg-panel">
        <table className="w-full min-w-[1100px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-silver bg-frost text-[11px] uppercase tracking-wide text-steel">
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
                key={`${r.uid}-${i}`}
                className="border-b border-silver/60 last:border-0 hover:bg-frost/50"
              >
                <td className="whitespace-nowrap px-3 py-2.5 font-medium text-onyx">
                  {r.welderName}
                  {r.isLegacy && (
                    <Badge tone="outline" className="ml-1.5">
                      Legacy
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2.5 font-mono text-[12px]">{r.uid}</td>
                <td className="px-3 py-2.5">{r.welderId}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.process}</td>
                <td className="px-3 py-2.5">{r.standard}</td>
                <td className="px-3 py-2.5">{r.jointType}</td>
                <td className="px-3 py-2.5">{r.product}</td>
                <td className="px-3 py-2.5">{r.position}</td>
                <td className="px-3 py-2.5">{r.materialGroups}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.thicknessRange}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.pipeOdRange}</td>
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
                  colSpan={MASTER_COLUMNS.length}
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
