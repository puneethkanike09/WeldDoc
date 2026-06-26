"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/sui/date-picker";
import { Select } from "@/components/sui/select";
import {
  getImportFieldKind,
  positionOptionsForJoint,
} from "@/lib/welders/bulk-import/field-config";
import type { ImportColumnKey } from "@/lib/welders/bulk-import/columns";
import { cn } from "@/lib/utils";

const compactInput = "h-8 min-w-34 px-2 text-xs";
const compactSelect = "h-8 min-w-34 px-2 text-xs";

export function ImportCellEditor({
  column,
  value,
  rowCells,
  invalid,
  onChange,
}: {
  column: ImportColumnKey;
  value: string;
  rowCells: Record<ImportColumnKey, string>;
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  const kind = getImportFieldKind(column);
  const invalidRing = invalid ? "border-ember ring-1 ring-ember/20" : "";
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  if (kind.type === "date") {
    return (
      <DatePicker
        value={value}
        onChange={onChange}
        placeholder="YYYY-MM-DD"
        withPortal
        className={cn(compactInput, "min-w-38", invalidRing)}
      />
    );
  }

  if (kind.type === "number") {
    return (
      <Input
        type="number"
        step={kind.step ?? "any"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onChange(draft);
        }}
        className={cn(compactInput, invalidRing)}
      />
    );
  }

  if (kind.type === "select" || kind.type === "position") {
    const options =
      kind.type === "position"
        ? positionOptionsForJoint(rowCells.joint_type)
        : kind.options;

    return (
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className={cn(compactSelect, invalidRing)}
      >
        {kind.type === "select" && kind.allowEmpty ? (
          <option value="">—</option>
        ) : null}
        {kind.type === "position" ? <option value="">—</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <Input
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onChange(draft);
      }}
      className={cn(compactInput, invalidRing)}
    />
  );
}
