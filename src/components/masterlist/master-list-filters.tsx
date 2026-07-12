"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

function pushFilters(
  router: ReturnType<typeof useRouter>,
  startTransition: (fn: () => void) => void,
  basePath: string,
  params: URLSearchParams,
) {
  const qs = params.toString();
  startTransition(() => {
    router.push(qs ? `${basePath}?${qs}` : basePath);
  });
}

export function WelderMasterListFilters({
  basePath,
  q,
  status,
  joint,
  trailing,
}: {
  basePath: string;
  q: string;
  status: string;
  joint: string;
  trailing?: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(q);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  function apply(next: { q?: string; status?: string; joint?: string }) {
    const params = new URLSearchParams();
    const newQ = (next.q ?? query).trim();
    const newStatus = next.status ?? status;
    const newJoint = next.joint ?? joint;

    if (newQ) params.set("q", newQ);
    if (newStatus !== "all") params.set("status", newStatus);
    if (newJoint !== "all") params.set("joint", newJoint);

    pushFilters(router, startTransition, basePath, params);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 lg:flex-row lg:items-center",
        isPending && "opacity-60",
      )}
    >
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search welder, ID or process"
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply({});
              }
            }}
          />
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="shrink-0"
          disabled={isPending}
          onClick={() => apply({})}
        >
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
      <Select
        value={status}
        onChange={(e) => apply({ status: e.target.value })}
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
        onChange={(e) => apply({ joint: e.target.value })}
        className="lg:w-36"
      >
        <option value="all">All joints</option>
        <option value="BW">Butt weld</option>
        <option value="FW">Fillet weld</option>
      </Select>
      {trailing ? <div className="flex flex-wrap gap-2">{trailing}</div> : null}
    </div>
  );
}

export function OperatorMasterListFilters({
  basePath,
  q,
  status,
  weldingType,
  weldingTypeOptions,
  trailing,
}: {
  basePath: string;
  q: string;
  status: string;
  weldingType: string;
  weldingTypeOptions: string[];
  trailing?: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(q);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  function apply(next: {
    q?: string;
    status?: string;
    weldingType?: string;
  }) {
    const params = new URLSearchParams();
    const newQ = (next.q ?? query).trim();
    const newStatus = next.status ?? status;
    const newWeldingType = next.weldingType ?? weldingType;

    if (newQ) params.set("q", newQ);
    if (newStatus !== "all") params.set("status", newStatus);
    if (newWeldingType !== "all") params.set("weldingType", newWeldingType);

    pushFilters(router, startTransition, basePath, params);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 lg:flex-row lg:items-center",
        isPending && "opacity-60",
      )}
    >
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search operator, ID or process"
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply({});
              }
            }}
          />
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="shrink-0"
          disabled={isPending}
          onClick={() => apply({})}
        >
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
      <Select
        value={status}
        onChange={(e) => apply({ status: e.target.value })}
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
        onChange={(e) => apply({ weldingType: e.target.value })}
        className="lg:w-40"
      >
        <option value="all">All welding types</option>
        {weldingTypeOptions.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>
      {trailing ? <div className="flex flex-wrap gap-2">{trailing}</div> : null}
    </div>
  );
}
