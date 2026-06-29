"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { RegistryListFilters } from "@/components/app/registry-list-filters";
import { RegistryListPagination } from "@/components/app/registry-list-pagination";
import { formatDate } from "@/lib/utils";
import { STATUS_TONE } from "@/lib/welder-status";
import type { WelderRow } from "@/lib/welders/registry-row";
import { Eye } from "lucide-react";

export type { WelderRow };

export function WeldersTable({
  rows,
  page,
  filteredCount,
  q,
  status,
  process,
  processOptions,
}: {
  rows: WelderRow[];
  page: number;
  filteredCount: number;
  q: string;
  status: string;
  process: string;
  processOptions: string[];
}) {
  return (
    <div>
      <RegistryListFilters
        basePath="/welders"
        q={q}
        status={status}
        process={process}
        processOptions={processOptions}
        searchPlaceholder="Search by name, UID or welder ID"
        pendingClassName="opacity-60"
      />

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
            {rows.map((r) => (
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
            {rows.length === 0 && (
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

      <Suspense fallback={null}>
        <RegistryListPagination
          basePath="/welders"
          page={page}
          totalCount={filteredCount}
          entityLabel="welders"
        />
      </Suspense>
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
