"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { REGISTRY_LIST_PAGE_SIZE } from "@/lib/registry/list-pagination";

export function RegistryListPagination({
  basePath,
  page,
  totalCount,
  entityLabel,
}: {
  basePath: string;
  page: number;
  totalCount: number;
  entityLabel: string;
}) {
  const searchParams = useSearchParams();
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / REGISTRY_LIST_PAGE_SIZE),
  );

  if (totalCount <= REGISTRY_LIST_PAGE_SIZE) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (targetPage <= 1) params.delete("page");
    else params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const from = (page - 1) * REGISTRY_LIST_PAGE_SIZE + 1;
  const to = Math.min(page * REGISTRY_LIST_PAGE_SIZE, totalCount);

  return (
    <nav
      className="mt-4 flex flex-col gap-3 border-t border-silver pt-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label={`${entityLabel} list pages`}
    >
      <p className="text-sm text-steel">
        Showing {from}–{to} of {totalCount} {entityLabel}
      </p>
      <div className="flex items-center gap-3">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="inline-flex h-9 items-center gap-1 rounded-[10px] border border-silver bg-panel px-3 text-sm font-medium text-charcoal hover:bg-frost"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Link>
        ) : (
          <span className="inline-flex h-9 items-center gap-1 px-3 text-sm text-steel">
            <ChevronLeft className="h-4 w-4" />
            Prev
          </span>
        )}
        <span className="text-sm text-steel">
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="inline-flex h-9 items-center gap-1 rounded-[10px] border border-silver bg-panel px-3 text-sm font-medium text-charcoal hover:bg-frost"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex h-9 items-center gap-1 px-3 text-sm text-steel">
            Next
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
