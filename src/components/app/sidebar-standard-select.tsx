"use client";

import { Select } from "@/components/sui/select";
import {
  WELDING_STANDARDS_CATALOG,
  type StandardSlug,
} from "@/lib/standards/catalog";
import { navigateToStandardWorkspace } from "@/lib/standards/active-standard";

export function SidebarStandardSelect({
  value,
  className,
}: {
  value: StandardSlug;
  className?: string;
}) {
  return (
    <Select
      value={value}
      aria-label="Active qualification standard"
      className={className}
      onChange={(e) => {
        const next = e.target.value as StandardSlug;
        if (next === value) return;
        navigateToStandardWorkspace(next);
      }}
    >
      {WELDING_STANDARDS_CATALOG.map((entry) => (
        <option
          key={entry.slug}
          value={entry.slug}
          disabled={entry.status !== "active"}
        >
          {entry.shortLabel}
          {entry.status !== "active" ? " — coming soon" : ""}
        </option>
      ))}
    </Select>
  );
}
