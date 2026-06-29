"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/sui/date-picker";
import { Select } from "@/components/sui/select";
import { getOperatorImportFieldKind } from "@/lib/operators/bulk-import/field-config";
import type { OperatorImportColumnKey } from "@/lib/operators/bulk-import/columns";
import { cn } from "@/lib/utils";

const compactInput = "h-8 min-w-34 px-2 text-xs";
const compactSelect = "h-8 min-w-34 px-2 text-xs";

export function OperatorImportCellEditor({
  column,
  value,
  invalid,
  onChange,
}: {
  column: OperatorImportColumnKey;
  value: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  const kind = getOperatorImportFieldKind(column);
  const invalidRing = invalid ? "border-ember ring-1 ring-ember/20" : "";
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  if (kind.type === "date") {
    return (
      <DatePicker
        value={draft}
        onChange={(v) => {
          setDraft(v);
          onChange(v);
        }}
        className={cn(compactInput, invalidRing)}
        withPortal
      />
    );
  }

  if (kind.type === "select") {
    return (
      <Select
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          onChange(e.target.value);
        }}
        className={cn(compactSelect, invalidRing)}
      >
        <option value="">—</option>
        {kind.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <Input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onChange(draft)}
      className={cn(compactInput, invalidRing)}
    />
  );
}
