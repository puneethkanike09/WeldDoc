"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { RegistryListFilters } from "@/components/app/registry-list-filters";
import { RegistryListPagination } from "@/components/app/registry-list-pagination";
import { TableScrollArea } from "@/components/ui/table-scroll-area";
import { formatDate } from "@/lib/utils";
import { STATUS_TONE } from "@/lib/operator-status";
import type { OperatorRow } from "@/lib/operators/registry-row";
import {
  ProcessStatusChips,
  QualCountLights,
} from "@/components/app/qual-traffic-lights";
import { Eye } from "lucide-react";

export type { OperatorRow };

export function OperatorsTable({
  rows,
  page,
  filteredCount,
  q,
  status,
  process,
  processOptions,
}: {
  rows: OperatorRow[];
  page: number;
  filteredCount: number;
  q: string;
  status: string;
  process: string;
  processOptions: string[];
}) {
  return (
    <div className="min-w-0">
      <RegistryListFilters
        basePath="/operators"
        q={q}
        status={status}
        process={process}
        processOptions={processOptions}
        searchPlaceholder="Search by name or operator ID"
        pendingClassName="opacity-60"
      />

      <TableScrollArea className="mt-5">
        <table className="w-full min-w-[880px] text-left text-[14px]">
          <thead>
            <tr className="border-b border-silver bg-frost text-[12px] uppercase tracking-wide text-steel">
              <th className="px-5 py-3 font-medium">Operator</th>
              <th className="px-5 py-3 font-medium">Operator ID</th>
              <th className="px-5 py-3 font-medium">Qualifications</th>
              <th className="px-5 py-3 font-medium">By process</th>
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
                    href={`/operators/${r.id}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar name={r.full_name} url={r.photoUrl} />
                    <div>
                      <p className="font-medium text-onyx">{r.full_name}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-3 font-mono text-[13px] text-charcoal">
                  {r.operator_id}
                </td>
                <td className="px-5 py-3">
                  <QualCountLights counts={r.summary.qualCounts} />
                </td>
                <td className="px-5 py-3">
                  <ProcessStatusChips statuses={r.summary.processStatuses} />
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
                    href={`/operators/${r.id}`}
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
                  colSpan={7}
                  className="px-5 py-12 text-center text-graphite"
                >
                  No operators match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableScrollArea>

      <Suspense fallback={null}>
        <RegistryListPagination
          basePath="/operators"
          page={page}
          totalCount={filteredCount}
          entityLabel="operators"
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
