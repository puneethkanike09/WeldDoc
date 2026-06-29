"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export function RegistryListFilters({
  basePath,
  q,
  status,
  process,
  processOptions,
  searchPlaceholder,
  pendingClassName,
}: {
  basePath: string;
  q: string;
  status: string;
  process: string;
  processOptions: string[];
  searchPlaceholder: string;
  pendingClassName?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(q);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  function applyFilters(next: {
    q?: string;
    status?: string;
    process?: string;
  }) {
    const params = new URLSearchParams();
    const newQ = (next.q ?? query).trim();
    const newStatus = next.status ?? status;
    const newProcess = next.process ?? process;

    if (newQ) params.set("q", newQ);
    if (newStatus !== "all") params.set("status", newStatus);
    if (newProcess !== "all") params.set("process", newProcess);

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${basePath}?${qs}` : basePath);
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center",
        isPending && pendingClassName,
      )}
    >
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyFilters({});
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
          onClick={() => applyFilters({})}
        >
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
      <Select
        value={status}
        onChange={(e) => applyFilters({ status: e.target.value })}
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
        onChange={(e) => applyFilters({ process: e.target.value })}
        className="sm:w-44"
      >
        <option value="all">All processes</option>
        {processOptions.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </Select>
    </div>
  );
}
