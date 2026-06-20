"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { formatDate } from "@/lib/utils";
import { STATUS_TONE, type WelderSummary } from "@/lib/welder-status";
import { Eye, Search } from "lucide-react";

export interface WelderRow {
  id: string;
  uid: string;
  welder_id: string | null;
  full_name: string;
  photoUrl: string | null;
  summary: WelderSummary;
}

export function WeldersTable({ rows }: { rows: WelderRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [process, setProcess] = useState("all");

  const processes = useMemo(
    () =>
      Array.from(new Set(rows.flatMap((r) => r.summary.processes))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (
        term &&
        !r.full_name.toLowerCase().includes(term) &&
        !r.uid.toLowerCase().includes(term) &&
        !(r.welder_id ?? "").toLowerCase().includes(term)
      )
        return false;
      if (status !== "all" && r.summary.overall !== status) return false;
      if (process !== "all" && !r.summary.processes.includes(process))
        return false;
      return true;
    });
  }, [rows, q, status, process]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, UID or welder ID"
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-44"
        >
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Expiring">Expiring soon</option>
          <option value="Expired">Expired</option>
          <option value="Pending">Pending</option>
          <option value="None">No qualification</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
        </Select>
        <Select
          value={process}
          onChange={(e) => setProcess(e.target.value)}
          className="sm:w-44"
        >
          <option value="all">All processes</option>
          {processes.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-5 overflow-hidden rounded-[var(--radius-card)] border border-silver bg-panel">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-silver bg-frost text-[12px] uppercase tracking-wide text-steel">
              <th className="px-5 py-3 font-medium">Welder</th>
              <th className="px-5 py-3 font-medium">UID</th>
              <th className="px-5 py-3 font-medium">Processes</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Nearest expiry</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-b border-silver/70 last:border-0 hover:bg-frost/50"
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/welders/${r.id}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar name={r.full_name} url={r.photoUrl} />
                    <div>
                      <p className="font-medium text-onyx">{r.full_name}</p>
                      {r.welder_id && (
                        <p className="text-xs text-steel">{r.welder_id}</p>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-3 font-mono text-[13px] text-charcoal">
                  {r.uid}
                </td>
                <td className="px-5 py-3 text-graphite">
                  {r.summary.processes.length
                    ? r.summary.processes.join(", ")
                    : "—"}
                </td>
                <td className="px-5 py-3">
                  <Badge tone={STATUS_TONE[r.summary.overall]}>
                    {r.summary.overall}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-charcoal">
                  {formatDate(r.summary.nearestExpiry)}
                  {r.summary.daysToExpiry !== null &&
                    r.summary.daysToExpiry >= 0 &&
                    r.summary.daysToExpiry <= 60 && (
                      <span className="ml-2 text-xs text-[#8a6a00]">
                        {r.summary.daysToExpiry}d
                      </span>
                    )}
                </td>
                <td className="px-5 py-3 text-right">
                  <ButtonLink
                    href={`/welders/${r.id}`}
                    variant="primary"
                    size="sm"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </ButtonLink>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-graphite"
                >
                  No welders match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-steel">
        {filtered.length} of {rows.length} welders
      </p>
    </div>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="h-9 w-9 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-onyx/5 font-display text-sm font-semibold text-graphite">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
