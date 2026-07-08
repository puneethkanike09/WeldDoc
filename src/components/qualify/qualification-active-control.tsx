"use client";

import { useTransition } from "react";
import { Select } from "@/components/sui/select";
import { Loader2 } from "lucide-react";

export function QualificationActiveControl({
  isActive,
  disabled,
  onSetActive,
}: {
  isActive: boolean;
  disabled?: boolean;
  onSetActive: (active: boolean) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-steel" />}
      <Select
        value={isActive ? "Active" : "Inactive"}
        disabled={pending || disabled}
        onChange={(e) =>
          startTransition(() => onSetActive(e.target.value === "Active"))
        }
        className="h-9 w-36 text-[13px]"
        aria-label="Qualification status"
      >
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </Select>
    </div>
  );
}
