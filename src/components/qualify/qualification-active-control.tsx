"use client";

import { useTransition } from "react";
import { Select } from "@/components/sui/select";
import { Loader2 } from "lucide-react";
import { runAsyncAction } from "@/lib/form-toast";

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
        onChange={(e) => {
          const active = e.target.value === "Active";
          startTransition(() =>
            runAsyncAction(() => onSetActive(active), {
              successMessage: active
                ? "Qualification marked active."
                : "Qualification marked inactive.",
            }),
          );
        }}
        className="h-9 w-36 text-[13px]"
        aria-label="Qualification status"
      >
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </Select>
    </div>
  );
}
