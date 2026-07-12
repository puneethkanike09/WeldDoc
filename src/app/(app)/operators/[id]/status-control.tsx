"use client";

import { useTransition } from "react";
import { Select } from "@/components/sui/select";
import { setOperatorStatus } from "../actions";
import type { WelderStatus } from "@/types/db";
import { Loader2 } from "lucide-react";
import { runAsyncAction } from "@/lib/form-toast";

export function StatusControl({
  operatorId,
  status,
}: {
  operatorId: string;
  status: WelderStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-steel" />}
      <Select
        value={status}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as WelderStatus;
          startTransition(() =>
            runAsyncAction(() => setOperatorStatus(operatorId, next), {
              successMessage: `Status updated to ${next}.`,
            }),
          );
        }}
        className="h-9 w-36 text-[13px]"
      >
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="Suspended">Suspended</option>
      </Select>
    </div>
  );
}
